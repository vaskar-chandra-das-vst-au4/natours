//! MODULES ->
const crypto = require('crypto');
// const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const Email = require('./../utilities/email');

///////////////////////////////////////////////////////////////////////////

//! JWT WEB TOKEN ->
//@ { id: newUser._id } - PAYLOAD DATA , process.env.JWT_SECRET - SECRET (get saved on server)
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

///////////////////////////////////////////////////////////////////////////

//! SIGN WEB TOKEN AND SEND RESPONSE FUNCTION ->
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  //@ SENDING COOKIES ->
  //~ In cookieOptions secure:true means cookie will only be generated and send over https request not on http.
  //~ httpOnly:true means browser in only allowed to recieve and send cookies with each request other than that it cant modify it.

  //! For production we no longer need to check for process.env.NODE_ENV === 'production' and then set cookieOptions.secure = true because this is not going to work on heroku as heroku modifies each incoming requests.
  //! on req we have a secure property which is set to true if the connection is actually secure but on heroku this dosent work because heroku proxy modifies and redirects all incoming requests before they reach to our application
  //! so in order to make this work we aslo need to check for req.header['x-forwarded-proto'] === 'https'
  //@ we need to take req for this to work.
  //@ aslo we need to make our application trust proxy by inserting a code in app.js - app.enable('trust proxy')
  // const cookieOptions = {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  //   ),
  //   httpOnly: true,
  // };
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  user.password = undefined; //@ To delete hashed password field from response object.

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

///////////////////////////////////////////////////////////////////////////

//! SIGN UP FEATURE ->
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  //~ JWT Web Token ->
  //@ { id: newUser._id } - PAYLOAD DATA , process.env.JWT_SECRET - SECRET (get saved on server)
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });
  //~ OR ->
  // const token = signToken(newUser._id);

  //~ Sendind Response ->
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });

  //~ OR---
  createSendToken(newUser, 201, req, res);
});

///////////////////////////////////////////////////////////////////////////

//! LOGIN FEATURE ->
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //~ 1) Check for email and password ->
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //~ 2) Check if user exist and password is correct ->
  //@ This user variable is now a document which has correctPassword INSTANCE method on it.
  //@ user.correctPassword(password, user.password); //Return true or false
  //@ LIST OF STATUS CODES - https://restfulapi.net/http-status-codes/
  const user = await User.findOne({ email }).select('+password');
  const passwordCheck = await user.correctPassword(password, user.password);
  if (!user || !passwordCheck)
    return next(new AppError('Password or Email is incorrect', 401));

  //~ 3) If everything is okay then send response with JWT web TOKEN
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, req, res);
});

///////////////////////////////////////////////////////////////////////////

//! PROTECT SENSITIVE DATA USING PROTECT MIDDLEWARE FUNCTION ->
exports.protect = catchAsync(async (req, res, next) => {
  //~ 1) Getting token and check if it's there -
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );

  //~ 2) Token Verification  -

  //@ If token exists then below codes will verify it by calling verify method on jwt and if token gets verified successfully then it will push a resolved promise otherwise rejected which are get handled using our globalErrorHandler.
  //@ jwt.verify(token, process.env.JWT_SECRET) - verify method is a asynchronous task but doesnot returns a promise of its so we need to promisify the function using builtin module util.
  //@ Promisifying ---
  //@ decoded - is the payload
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //~ 3) Check if user still exists -
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        'The user belonging to this token does no longer exits.',
        401
      )
    );

  //~ 4) Check if user changed password after token issued -
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('Password recently changed! Please login again.', 401)
    );
  //~ 5) Grant Access to Protected Route -
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

///////////////////////////////////////////////////////////////////////////

//! CHECK USER IS LOGGED IN OR NOT FOR WEBSITE ONLY NOT FOR API ->
//@ here we dont want to send or catch any error.
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      if (currentUser.changedPasswordAfter(decoded.iat)) return next();

      //~ If execution of below code happens then it means a logged in user exist and then that user is passed to the res.locals property.
      //@ res.locals.user is the property which is going to be avilable on every pug template.
      //@ this is similar to passing data into render function for PUG templates.
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

///////////////////////////////////////////////////////////////////////////

//! LOG OUT USER ->
//@ Since the cookie we are sending is httpOnly:true means browser in only allowed to recieve and send cookies with each request other than that it cant modify it. So we have no way of deleting it.
//~ so in order to log out user we can send a dummy jwt token with same name as original when user will click on LOGOUT button this then rewrite this dummy jwt token over original . This way when the page will get reloaded isLoggedIn function find that jwt verification is failed so sign in will not happen and then finally the user will be logged out.

exports.logout = async (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

///////////////////////////////////////////////////////////////////////////

//! RESTRICT USER TO PERFORM CERTAIN TASK ->
exports.restrictTo = (...roles) => {
  //~ req.user.role - Already defined in protect middleware
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You are not allowed to perform this action', 403)
      );

    next();
  };
};

///////////////////////////////////////////////////////////////////////////

//! FORGOT PASSWORD ->
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //~ 1) Find user on the basis of provided email -
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError('There is no user with the given email address', 404)
    );
  //~ 2) Generate random reset token -
  const resetToken = user.createPasswordResetToken();
  // const resetToken = await user.createPasswordResetToken();
  //@ Here we set the property of a document which we need to save and await to reflect it in the user document.That is we are modifying/patching the original user doc.
  //@ This keyword in resetToken points toward the user document.
  //@ NOTE - While resetting the password Client will not pass all the fields which are needed to create a user document which results that we will get an error while saving that reset req. To avoid that we need pass an object of option - { validateBeforeSave: false }.
  await user.save({ validateBeforeSave: false });
  // console.log(resetToken);
  //~ 3) Send random unhashed resetToken to the client over email -
  //@ So that we can compare it with its hashed version which is stored in the user document.
  //@ Here we need to do more than just throwing an error using global error handler so we use try-catch block
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your password? Submit a PATCH request with your new password and confirmPassword to: ${resetURL}.\nIf you didn't forgot your password, please ignore this email!`;

    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });
    await new Email(user, resetURL).sendPasswordReset();

    //~ 4) Send response -
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    //~ 5) Reset hashed token and token duration of user document -
    //@ As manupulating the user doc which is basically a patch request we need to save it.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

///////////////////////////////////////////////////////////////////////////

// //!  OR --RESET PASSWORD ->
// exports.resetPassword = catchAsync(async (req, res, next) => {
//   //~ 1) Get user based on token -
//   const user = await User.findOne({ email: req.body.email }, passwordResetExpires: { $gt: Date.now() },);
//   const hashedToken = await bcrypt.compare(
//     req.params.token,
//     user.passwordResetToken
//   );
//   console.log(user, req.params.token, hashedToken);

//   //~ 2) If token has not expired and there is a user then set the new password -
//   if (!hashedToken)
//     return next(new AppError('Token is invalid or has expired.', 400));

//   user.password = req.body.password;
//   user.passwordConfirm = req.body.passwordConfirm;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
//   await user.save();

//   //~ 3) Update the passwordChangedAt property for the user -
//   //~ 4) Log the user in and send JWT -
//   const token = signToken(user._id);
//   res.status(200).json({
//     status: 'success',
//     token,
//   });
// });

///////////////////////////////////////////////////////////////////////////

//! RESET PASSWORD ->
exports.resetPassword = catchAsync(async (req, res, next) => {
  //~ 1) Get user based on token -
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // console.log(hashedToken);
  // console.log(user);
  //~ 2) If token has not expired and there is a user then set the new password -
  if (!user) return next(new AppError('Token is invalid or has expired.', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //~ 3) Update the passwordChangedAt property for the user -
  //@ Define a middleware function in userModel.

  //~ 4) Log the user in and send JWT -
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
  createSendToken(user, 200, req, res);
});

///////////////////////////////////////////////////////////////////////////

//! UPDATE PASSWORD ->
exports.updatePassword = catchAsync(async (req, res, next) => {
  //~ 1) Get user from collection -
  const user = await User.findById(req.user.id).select('+password');
  //~ 2) Check the posted password is correct -
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Password is incorrect! Try again.', 401));
  //~ 3) If so then update password -
  //@ we cant use .findByIdAndUpdate() because password and passwordConfirm validator do not work for this method it only work for save() and create(). Aslo document save pre hooks not gonna work.
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //~ 4) Log user in and send JWT -
  createSendToken(user, 200, req, res);
});

///////////////////////////////////////////////////////////////////////////

//! MODULES ->
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const validator = require('validator');
// const AppError = require('../utilities/appError');

//! USER SCHEMA ->
//~ NOTE - Each field we need to specify in signUp middleware
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'lead-guide', 'guide'],
      message: 'Difficulty can be between easy, medium and difficult!',
    },
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        //This only work on save and create.
        return el === this.password;
      },
      message: 'Password are not same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
//~ MIDDLEWARES ->
//! HASH PASSWORD ->
//@ Run on each save request Only will not work for findByIdAndUpdate and other methods.
userSchema.pre('save', async function (next) {
  //~ If password is not modified then hashing will not be done ->
  if (!this.isModified('password')) return next();
  //~ Password will be hashed if it is modified
  //@ Hash method returns a promise.2nd parameter its take called cost parameter, higher the cost basically the more cpu intensive the proccess will be and the better the password will be encrypted.Default cost is 10 it is better to use 12 for better password encryption. This hash is the asynchronous version.
  this.password = await bcrypt.hash(this.password, 12);

  //~ Deleting or setting this undefined before saving the document into DB ->
  this.passwordConfirm = undefined;
  next();
});

//! SET PROPERTY (passwordChangedAt) ->
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  //~ Sometimes saving to the database is a bit slower than issuing a JWT token which creates a problem in which user cant able to login again.
  //@ 1sec is substracted which means passwordChangedAt will be set 1sec earlier than the time at which actual password is changed.
  this.passwordChangedAt = Date.now() - 1000;

  // const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  // console.log(
  //   new Intl.DateTimeFormat(locale, {
  //     month: '2-digit',
  //     year: '2-digit',
  //     day: '2-digit',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //   }).format(new Date(this.passwordChangedAt))
  // );

  next();
});

//! FILTER DOCUMENTS BASED ON ACTIVE PROPERTY ->
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//~ INSTANCE METHODS ->
//@ Method which is avilable on all the DOCUMENTS of a certain collection
//@ This is like declaring methods in the prototype of an Objects made using a Constructor Class.
//@ This keyword points toward the current document that is the document on which the instance method will be called.

//! CHECK PASSWORD ->
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//! CHECK IF THE PASSWORD IS CHANGED AFTER THE TOKEN HAS ISSUED OR NOT ->
//@ After logingIn if a user change his password then he needs to logIn again so that he can again access protected Data.
//@ And this functionality is implemented by comparing time of issuing JWT token and password change.
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  //~ TRUE - Password CHANGED
  if (this.passwordChangedAt) {
    const changedTimestamp = Number.parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }
  //~ FALSE - Password Not CHANGED
  return false;
};

// //! OR ---GENERATE passwordResetToken ->
// userSchema.methods.createPasswordResetToken = async function () {
//   //@ Random Reset Token Sting -
//   const resetToken = crypto.randomBytes(32).toString('hex');

//   //@ Store Hashed resetToken in the Document - Hasing of resetToken
//   this.passwordResetToken = await bcrypt.hash(resetToken, 10);

//   //@ Setting 10min time for Password Reset and store it in the document -
//   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
//   console.log(
//     'randomBytes',
//     resetToken,
//     'hashed randomBytes',
//     this.passwordResetToken
//   );
//   //@ Return unhased resetToken string -
//   return resetToken;
// };

//! GENERATE passwordResetToken ->
userSchema.methods.createPasswordResetToken = function () {
  //@ Random Reset Token Sting -
  const resetToken = crypto.randomBytes(32).toString('hex');

  //@ Store Hashed resetToken in the Document - Hasing of resetToken
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //@ Setting 10min time for Password Reset and store it in the document -
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // console.log(
  //   'randomBytes',
  //   resetToken,
  //   'hashed randomBytes',
  //   this.passwordResetToken
  // );
  //@ Return unhased resetToken string -
  return resetToken;
};

//! CREATE MODEL AND EXPORT ->
const User = mongoose.model('User', userSchema);
module.exports = User;

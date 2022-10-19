const AppError = require('./../utilities/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldDB = err => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: "${value}". Please use another value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  const message = `Invalid Data: ${Object.values(err.errors)
    .map(e => e.message)
    .join('. ')}.`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token! Please try login again.', 401);

const handleJWTExpiredToken = () =>
  new AppError('Your Token has expired! Please login again.', 401);

//! DEVELOPMENT ->
const sendErrorDev = (err, req, res) => {
  //@ ERROR FOR API -
  if (req.originalUrl.startsWith('/api'))
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  //@ ERROR FOR WEBSITES -
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

//! PRODUCTION ->
const sendErrorProd = (err, req, res) => {
  //@ ERROR FOR API -
  if (req.originalUrl.startsWith('/api')) {
    //Operational - Trusted Error- Send message to Client
    if (err.isOperational)
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    //~ When Error is not operational -
    //Programming or any other type of Unknown Error - Dont leak to Client
    //1. Log error ->
    console.error(`Error 🔥`, err);
    //2. Sending a Generic Error Message ->
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  //@ ERROR FOR WEBSITES -
  if (err.isOperational)
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });

  //~ When error is not operational -
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};
//! GLOBAL ERROR HANDLING MIDDLEWARE ->
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //@ here err.name property is in the prototype of this err object that why it is not present in error.As we know prototypal properties are not get passed while destructuring.So we need to compare err.name ==="CastError" not error.name ==="CastError"
    let error;
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    else if (err.code === 11000) error = handleDuplicateFieldDB(err);
    else if (err.name === 'ValidationError')
      error = handleValidationErrorDB(err);
    else if (err.name === 'JsonWebTokenError') error = handleJWTError();
    else if (err.name === 'TokenExpiredError') error = handleJWTExpiredToken();
    else error = err;

    sendErrorProd(error, req, res);
  }
};

// // OLD CODE ->
// module.exports = ((err, req, res, next) => {
//     // console.log(err.stack); // This tells where the error happened.
//     err.statusCode = err.statusCode || 500;
//     err.status = err.status || 'error';
//     res.status(err.statusCode).json({
//         status: err.status,
//         message: err.message
//     })
//     // next() //this is not needed here because it is the last middleware in the stack.
// })

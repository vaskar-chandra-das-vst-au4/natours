//! MODULES - Handlers Functions/Controllers FOR USERS ->
const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const factory = require('./handlerFactory');

//! UPLOAD USER PHOTO ->
// Readme - https://github.com/expressjs/multer#readme
// destination is used to determine within which folder the uploaded files should be stored. This can also be given as a string (e.g. '/tmp/uploads'). If no destination is given, the operating system's default directory for temporary files is used.

// Note: You are responsible for creating the directory when providing destination as a function. When passing a string, multer will make sure that the directory is created for you.

// filename is used to determine what the file should be named inside the folder. If no filename is given, each file will be given a random name that doesn't include any file extension.

// cb = callback function which will be called with image or error. If first argument is null that means no error is passed.
// file = req.file .. which contains all the info about uploaded file.
// {
//   fieldname: 'photo',
//   originalname: 'leo.jpg',
//   encoding: '7bit',
//   mimetype: 'image/jpeg',
//   destination: 'public/img/users',
//   filename: 'user-5c8a1f292f8fb814b56fa184-1665240290992.jpeg',
//   path: 'public\\img\\users\\user-5c8a1f292f8fb814b56fa184-1665240290992.jpeg',
//   size: 207078
// }

//@ Determine file path and its  name ->
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

//~ Store image into memory ->
// req.file.buffer - location of img in memory
const multerStorage = multer.memoryStorage();

//@ Restrict uploaded file types ->
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not an image! Please upload only images.', 400), false);
};

// const upload = multer({ dest: 'public/img/users' });
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  // Here file name is not created yet but in next middleware we need it to write img on disk so we needed to manually define it here.
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

//! Filter Object Function ->
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });

  return newObj;
};

//! UPDATE AUTHENTICATED USER DATA ->
exports.updateMe = catchAsync(async (req, res, next) => {
  //   console.log(req.file);
  //~ 1) Throw Error if user try to update password using this route -
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );

  //~ 2) Exclude unwanted fields -
  //@ Currently only name and email is allowed to update.
  const filteredObj = filterObj(req.body, 'email', 'name');
  if (req.file) filteredObj.photo = req.file.filename;

  //~ 3) Update User Document and send response -
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  }).select('-__v');

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

//! DELETE CURRENT USER THAT IS FOR LOGGED IN USER ->
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

//! MY DETAILS ->
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//! CREATE USER - NOT DEFINED ->
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

//! ALL DEFINED ROUTE CONTROLLERS ->
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); //@ Dont use it to update password.
exports.deleteUser = factory.deleteOne(User);

//~ OLD CODE ->
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   //! Sending response ->
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

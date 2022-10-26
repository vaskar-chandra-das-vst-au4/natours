//! USER ROUTER ->

const express = require('express');
// const multer = require('multer');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');

const {
  signup,
  login,
  logout,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  restrictTo,
} = require('../controllers/authenticationController');

//! Handling file uploads ->
// const upload = multer({ dest: 'public/img/users' });

//@ Creating Routers ->
const router = express.Router();

//! USERS ->
router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

//@ From here all routes need authentication ->
//~ For this we are using a common middleware on router which will protect all those routes which are defined after this middleware function.
//~ Because of this we dont need to define protect middleware in each and every routes individually for which we want authentication.
router.use(protect);

router.patch('/updateMyPassword', updatePassword);
router.get('/me', getMe, getUser);

router.delete('/deleteMe', deleteMe);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);

router.use(restrictTo('admin'));
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;

//OLD CODES ->
// router.patch('/updateMyPassword', protect, updatePassword);
// router.get('/me', protect, getMe, getUser);

// router.delete('/deleteMe', protect, deleteMe);
// router.patch('/updateMe', protect, updateMe);

// router.route('/').post(createUser).get(getAllUsers);

// router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

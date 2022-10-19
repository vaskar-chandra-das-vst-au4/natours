const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
  getSignupForm,
  getAccount,
  updateUserData,
  getMyTours,
} = require('../controllers/viewController');

const { createBookingCheckout } = require('../controllers/bookingController');

const {
  isLoggedIn,
  protect,
} = require('../controllers/authenticationController');

const router = express.Router();

// /tours/${tour.slug} - url starting using slash are relative urls
// router.use(isLoggedIn);

router.get('/', createBookingCheckout, isLoggedIn, getOverview);
router.get('/login', isLoggedIn, getLoginForm);
router.get('/signup', isLoggedIn, getSignupForm);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/me', protect, getAccount);
router.get('/my-tour', protect, getMyTours);
//! NEEDED IF WE USE HTML FORM TO DIRECTLY SEND DATA TO SERVER WITHOUT JAVASCRIPT
// router.post('/submit-user-data', protect, updateUserData);

module.exports = router;

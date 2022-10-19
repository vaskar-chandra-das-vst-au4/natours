const express = require('express');
const {
  getCheckoutSession,
  deleteBooking,
  updateBooking,
  getBooking,
  getAllBookings,
  createBooking,
} = require('../controllers/bookingController');
const {
  protect,
  restrictTo,
} = require('../controllers/authenticationController');

const router = express.Router();

router.use(protect);

router.get('/checkout-session/:tourId', getCheckoutSession);

router.use(restrictTo('admin', 'lead-guide'));

router.route('/').get(getAllBookings).post(createBooking);
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

module.exports = router;

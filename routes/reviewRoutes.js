const express = require('express');

const {
  getAllReview,
  createReview,
  deleteReview,
  updateReview,
  setTourAndUserId,
  getReview,
} = require('../controllers/reviewController');

const {
  protect,
  restrictTo,
} = require('../controllers/authenticationController');

//! Since to create new review from tour Route we need access of tourId from this /:tourId/reviews . For that we need to merge parameter of both tour and review routes like this. By default a route have only access of its own parameter.
const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getAllReview)
  .post(restrictTo('user'), setTourAndUserId, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

//~ EXPORTING ROUTER ->
module.exports = router;

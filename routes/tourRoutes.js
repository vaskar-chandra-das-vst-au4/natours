//! TOUR ROUTER ->

const express = require('express');

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getToursStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
} = require('./../controllers/tourController');

const {
  protect,
  restrictTo,
} = require('./../controllers/authenticationController');

// const { createReview } = require('./../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

//@ Creating Routers -
const router = express.Router();

//~  NESTED ROUTES ->
//@ This way of implementation creates duplicate code and it is not a good practice to define reviewRoutes in tourRoutes.
// /tours/tourID/reviews/reviewID This way we can get access to a reviews of a particular tour using nested route.
// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo('user'), createReview);
//@ OR -- Mounting/redirecting all routes /:tourId/reviews on reviewRouter from router of tour. like we did with app.use
router.use('/:tourId/reviews', reviewRouter);

//! TOURS ->
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getToursStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

//@ Route for geospatial Queries ->
// Using parameters - /tours-within/:distance/center/:latlng/unit/:unit
// Using query string - /tours-within?distance=400&latlng=30,-67&unit=km
// But we will use parameters because it looks nicer than the later.
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);
//~ For Distances -
router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;

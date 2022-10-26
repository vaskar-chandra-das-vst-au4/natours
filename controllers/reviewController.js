const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');
// const catchAsync = require('./../utilities/catchAsync');
// const AppError = require('./../utilities/appError');

//! SET TOUR AND USER ID ON req.body COMING FROM TOUR ROUTE PARAMETER ->
//@ So it can be used TO CREATE REVIEW ON A PARTICULAR TOUR.
//@ This way we can create reviews on tours without mentioning any tour or user ids in req.body
exports.setTourAndUserId = (req, res, next) => {
  //~ Give Access to Tour and user Id for nested Route.
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

//! CONTROLLERS OR ROUTE HANDLERS ->
exports.getAllReview = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);

//@ OLD CODES ->
// exports.createReview = catchAsync(async (req, res, next) => {
//   // //Give Access to Tour and user Id for nested Route.
//   // if (!req.body.tour) req.body.tour = req.params.tourId;
//   // if (!req.body.user) req.body.user = req.user.id;
//   const newReview = await Review.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// });

// exports.getAllReview = catchAsync(async (req, res, next) => {
//   // let reviews;
//   // if (req.params.tourId)
//   //   reviews = await Review.find({ tour: req.params.tourId });
//   // else reviews = await Review.find();
//   //@ OR --
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

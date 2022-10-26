const AppError = require('../utilities/appError');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utilities/catchAsync');

// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'Exciting tours for adventurous people',
//     user: 'Vaskar',
//   });
// });
///////////////////////////////////////////////////////////////////////////

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your booking is successful! Please check your mail for confirmation. If your booking doesn't show up here immediately, please come back later.";

  next();
};

//@ GET OVERVIEW ->
exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

///////////////////////////////////////////////////////////////////////////

//@ GET TOUR ->
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate(
    'reviews',
    'review rating user'
  );

  if (!tour) return next(new AppError('There is no tour with that name.', 404));

  // res
  //   .status(200)
  //   .set(
  //     'Content-Security-Policy',
  //     "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
  //   )
  //   .render('tour', {
  //     title: tour.name,
  //     tour,
  //   });
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

///////////////////////////////////////////////////////////////////////////

//@ GET LOGIN FORM ->
exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

///////////////////////////////////////////////////////////////////////////

//@ GET SIGNUP FORM ->
exports.getSignupForm = catchAsync(async (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Create new account',
  });
});
//@ GET ACCOUNT DETAILS ->
exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
});

//! GET MY TOURS ->
exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  //2) Find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);
  // tours will contain all the tours whose id is present if tourIDs array. In this 'in' operator used
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

//! UPDATE CURRENT USER ->
//@ NEEDED IF WE USE HTML FORM TO DIRECTLY SEND DATA TO SERVER WITHOUT JAVASCRIPT
// exports.updateUserData = catchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email,
//     },
//     {
//       new: true,
//       runValidators: true,
//     }
//   );

//   res.status(200).render('account', {
//     title: 'Your account',
//     user: updatedUser,
//   });
// });

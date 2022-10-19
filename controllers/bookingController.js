//! This stripe import only work on backend .. And this need stipe secret key.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const AppError = require('./../utilities/appError');
const catchAsync = require('./../utilities/catchAsync');
const factory = require('./handlerFactory');

//! GET CHECKOUT SESSION ->
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //~ 1) Get the currently booked tour -
  const tour = await Tour.findById(req.params.tourId);
  // console.log(tour);

  //~ 2) Create checkout session -
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  //~ 3) Create session as response -
  res.status(200).json({
    status: 'success',
    session,
  });
});

//! CREATE BOOKING CHECKOUT ->
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is temporary because if anyone know about the query string then can easily create bookings without paying.
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

//! CRUD OPERATIONS ->
exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

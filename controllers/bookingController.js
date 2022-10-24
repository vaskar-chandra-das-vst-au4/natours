//! This stripe import only work on backend .. And this need stipe secret key.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utilities/catchAsync');
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
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tour`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'inr',
          unit_amount: tour.price * (1 / 3.67),
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
            ],
          },
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
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is temporary because if anyone know about the query string then can easily create bookings without paying.
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });
//   res.redirect(req.originalUrl.split('?')[0]);
// });

//@ All of this code will run whenever the payment was successful and stipe will then call our webhok which is the URL which is going to call this middleware function and so this function recieves a body from the request and then together with the signature and webhook secret creates an event which will contain the session and then using that session data we can create our new booking into our database.
const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / (1 / 3.67);
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  //1) Read stripe signature out of the req.header
  //When stripe call our webhook it will add a stripe signature in the header.
  const signature = req.headers['stripe-signature'];

  //2) Create Stripe Event
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error : ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
    res.status(200).json({ received: true });
  }
};

//! CRUD OPERATIONS ->
exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

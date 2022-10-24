//! MAIN APPLICATION ->

//! MODULES ->
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const globalErrorHanlder = require('./controllers/errorController');
const AppError = require('./utilities/appError');

//! CREATING AND MOUNTING MULTIPLE ROUTERS ->
//@ IMPORTS - ROUTERS
const viewRouter = require(`${__dirname}/routes/viewRoutes`);
const tourRouter = require(`${__dirname}/routes/tourRoutes`);
const userRouter = require(`${__dirname}/routes/userRoutes`);
const bookingRouter = require(`${__dirname}/routes/bookingRoutes`);
const {
  webhookCheckout,
} = require(`${__dirname}/controllers/bookingController`);
const reviewRouter = require(`${__dirname}/routes/reviewRoutes`);

const app = express();

//@ Enable proxy
app.enable('trust proxy');

//@ PUG -
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//~ Route for PUG -
//@ We can pass variables into pug using an object inside render function.
// app.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'Exciting tours for adventurous people',
//     user: 'Vaskar',
//   });
// });

// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     tour: 'All Tours',
//     user: 'Vaskar',
//   });
// });

// app.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     tour: 'The Forest Hiker',
//     user: 'Vaskar',
//   });
// });

//! GLOBAL MIDDLEWARE ->

//! CORS - Cross origin resourse sharing ->
//@ Browsers block all the requests from different domain coming to our natours api for security purposes.
//@ That means if we host our frontend and backend(api) parts on different domain then we cant make requests from frontend to our backend using axios or fetch functions.
//@ For example our frontend is hosted on natours.com and backend on api.natours so all the requests made from frontend to api.natours will be blocked by the browser.

//@ In this project we are hosting both frontend and backend parts on the same domain that is https://natours-vcdas.herokuapp.com/ that's why it is not a problem for our client app to communicate with the api. But we want our api to get utlised by others aslo so in this case we need to set some headers using cors npm package which will make our api to get consumed from any domain.

//@ Access-Control-Allow-Origin set to "*" means for all requests.
//~ This will allow any domain to communicate to our api. But may be sometimes we need to just allow some specific domain to access our api. So for that we have to specify origin property.
//@ Like this app.use(cors({origin:'https://example.com/'}))

//~ Or we may allow only certain api url to be available to all for that we need to specify cors() middleware there.
//@ Like app.use('/api/v1/tours', cors() , tourRouter);
app.use(cors());

//! GET and POST are called simple requests which are now allowed using above code to other domains.

//! PUT, PATCH and DELETE are Called non-simple requests, and cookie requests are still not allowed.
//! These non-simple requests need so called preflight phase. So whenever there is a non-simple request the browser will automatically issue the preflight phase .

//! That is before the real request actually happens let say delete request the browser first does a option request in order to figure out if the actual request is safe to send. So developers need to make our app to respond to this option request and option request is really just like other type of http requests.

//! so basically when we get one of these option requests on our server we then need to send back the same access-control-allow-origin header . And this way browser will then know that the actual request and in this case a delete request is safe to perform and then execute the actual delete request.
//~ and this app.options is just like other app.get or app.delete requests. "*" means for all non-simple requests route them to our api using cors().
app.options('*', cors());
//@ For specific routes - app.options('/api/tour/:id', cors() )

//! Serve static files -
app.use(express.static(path.join(__dirname, 'public')));

//~ Set security HTTP headers -
//@ Helmet helps to secure Express apps by setting various HTTP headers.
//@ It should be placed at the top of middleware stack so that it can set all the headers properly.
// app.use(helmet({ crossOriginEmbedderPolicy: true, originAgentCluster: true }));
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:', 'https://js.stripe.com/'],
      imgSrc: ["'self'", 'https: data: blob:'],
      scriptSrc: [
        "'self'",
        'https://*.cloudflare.com',
        'https://js.stripe.com/v3/',
      ],
      // connectSrc: ["'self'", "blob:"],
    },
  })
);

//~ Development logging -
console.log(`App is in ${process.env.NODE_ENV}.`);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//~ EXPRESS RATE LIMIT -
//@ This will help to prevent Denial of service and brute force attack.
//@ https://www.npmjs.com/package/express-rate-limit
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //1hr in miliseconds ..windowMs represent time after which again req can be made by the same ip.
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//! Stripe Webhooks -
//@ This we need to put before body parser . Because when we will recieve a body in the webhookChecout handler function from stripe , the stripe function that we are gonna use to actually read the body needs this body in the raw form so basically as a string and not as JSON. That is in this handler the body must not be in JSON.
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);

//! Body parser - use to read data from req.body -
//@ Only allow to pass 10kb of data in req.body.
app.use(express.json({ limit: '10kb' }));
//! BODY PARSER FOR HTML FORM ->
//@ The format in which HTML form send data is urlencoded.
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
//! COOKIE PARSER - COOKIE FROM CLIENT SIDE
//@ With each req browser send the recieved cookie.
app.use(cookieParser());

//! DATA SANTITIZATION ->
//@ 1) Against NoSQL query Injection
app.use(mongoSanitize());
//@ 2) Against XSS(Cross site scripting attack)
//~ It prevents against malicious HTML codes alongwith some js codes
app.use(xss());

//! PREVENT HTTP PARAMETER POLLUTION ->
//@ It prevents against duplicate params like sort.
//@ But sometimes we need duplicates parameters like price ,duration so we need to whitelist those.
app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'difficulty',
      'ratingsQuantity',
      'maxGroupSize',
    ],
  })
);

//! Compress all Data such JSON and HTML code ->
//@ This returns a midlleware function will in return compress all the requested text send to client but it will not going to compress images because they are already compressed.
app.use(compression());

//~ Test Middleware -
// app.use((req, res, next) => {
//   console.log(req.headers);
//   console.log(req.cookies);
//   next();
// });

//@ Mounting Routers -> Mounting must be done after all declarations and Routes.
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

//! ERROR HANDLING FOR ALL UNDEFINED ROUTES ->
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: "Fail",
  //   message: `The requested route ${req.originalUrl} is not found on the server!`
  // })
  // const err = new Error(`The requested route ${req.originalUrl} is not found on the server!`);
  // err.statusCode = 404;
  // err.status = 'fail'
  // next(err);

  //OR -
  next(
    new AppError(
      `The requested route ${req.originalUrl} is not found on the server!`,
      404
    )
  );
});

//! GLOBAL ERROR HANDLING MIDDLEWARE ->
//@ Express has its own error handling functionality, It uses a error handling middleware to catch any type of operational errors within our whole code.
//@ next() - If we pass any argument to this next() function of any middleware then express will consider that argument as an error and then it will skip all the middleware stacks except the error handling middleware.
//~ If a middleware has four argument then express automatically consider that middleware as a error handling middleware
// app.use((err, req, res, next) => {
//   console.log(err.stack); // This tells where the error happened.
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';
//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message
//   })
//   // next() //this is not needed here because it is the last middleware in the stack.
// })

//@ OR - Exported
app.use(globalErrorHanlder);

//! EXPORTING APP FOR CREATING SERVER->
module.exports = app;

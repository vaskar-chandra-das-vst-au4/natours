//! Imports ->
const mongoose = require('mongoose');
const dotenv = require('dotenv');

//! Uncaught Exceptions - Errors which are occured due to synchronous code
//@ Catching uncaught exceptions ->Must be at top before any other code even before our modules.
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 🐛 Shutting down.....');
  if (process.env.NODE_ENV === 'development') console.log(err);
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//! Connect method returns a promise so we need to handle that using then method.
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log(`DB connected Established Successfully!`);
  }); //But This way we have to handle manually all the rejected promises which is difficult in big application.
// .catch(err => console.log(err));

//! START Server ->
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//@ Unhandled rejections -> Handling Rejected Promises Globally
//! Each time that there is an unhandled rejected promise Process object emits an object called unhandled rejection so we can listen to this event.
process.on('unhandledRejection', err => {
  console.log('UNCAUGHT REJECTION! 🐛 Shutting down.....');
  console.log(err.name, err.message);
  //@ If app unable to connect to database then we can do nothing other than shutting down our app using process.exit()
  // process.exit(0) //Stands for Success
  // process.exit(1) //stands for uncaught exception //Shutting the app like this is a very abrupt way of closing the app because by doing this we are immediately shutting the application as a result it will abort immediately all the requests which are still running or pending which is not good . SO WE MUST SHUT DOWN THE SERVER FIRST AND THEN ONCE IT DONE SERVER HAS TO SHUT DOWN.
  server.close(() => process.exit(1));
});

//! Heroku emits a sick term signal time to time.
//! Heroku dyno is just name of the container in which our application runs so these dynos restart after every 24hr in order to keep our app in a healthy state and the way heroku does this is by sending so called "sick term signal" to our node application and the application will basically shutdown immediately.
//! But the problem with this is that the shut down can be very abrupt so this can then leave requests that are currently being proccessed basically hanging in the air and so that not ideal.

process.on('SIGTERM', () => {
  console.log('🙃 SIGTERM RECIEVED. Shutting down gracefully');
  server.close(() => {
    console.log('😭 Process Terminated!');
  });
});

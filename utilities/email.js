//@ We will use a fake development tool called "Mail Trap" which will fake sending email to real email address. Using this we can prevent ourself from sending dev email or test email to clients.
//! Well Known Email service providers are mailgun and sendgrid.

//~ NPM NODEMAILER FUNCTION  ->
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

//~ ENVIRONMENT VARIABLES ->
const {
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
  EMAIL_PORT,
  EMAIL_HOST,
  EMAIL_FROM,
  NODE_ENV,
  SENDGRID_USERNAME,
  SENDGRID_PASSWORD,
} = process.env;

//! EMAIL CLASS ->
//@ Sample  -  new Email(user,rul).sendWelcome();
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Vaskar Chandra Das <${EMAIL_FROM}>`;
  }
  //~ Create transpoter
  newTransport() {
    if (NODE_ENV === 'production') {
      // Nodemailer already knows about SendGrid thats why we dont need to declare host and port for that.
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: SENDGRID_USERNAME,
          pass: SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD,
      },
    });
  }
  //~ Send email
  async send(template, subject) {
    //@ 1) Render HTML based  on a PUG template -
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    //@ 2) Define email options -
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html, {
        wordwrap: 130,
      }),
    };

    //@ 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};

//~ SEND BASIC EMAIL FUNCTION ->
// const sendEmail = async options => {
//   //! 1. CREATE A TRANSPORTER - Means a email provider
//   const transporter = nodemailer.createTransport({
//     host: EMAIL_HOST,
//     port: EMAIL_PORT,
//     auth: {
//       user: EMAIL_USERNAME,
//       pass: EMAIL_PASSWORD,
//     },
//   });

//! 2. DEFINE EMAIL OPTIONS -
//   const mailOptions = {
//     from: 'Vaskar Chandra Das <vcdas123@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };
//   //! 3. ACTUALLY SEND THE EMAIL -
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;

//~ TRANSPORTER FOR GMAIL ->
//@ Using Gmail in a production app is not a good idea because it has some restrictions like it can send only 500 email per day aslo it marks as spammer if email sending is very frequent. Unless the app is private in which bulk sending of email is not so much needed we can use Gmail or any Other email service providers.
// const transporter = nodemailer.createTransport({
//     service:'Gmail',
//     auth:{
//         user:process.env.EMAIL_USERNAME,
//         pass:process.env.EMAIL_PASSWORD
//     }
//     //@ Activate in Gmail - "less secure app" option
// })

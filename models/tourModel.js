const mongoose = require('mongoose');
// const User = require('./userModel');
const slugify = require('slugify');
// const validator = require('validator');
//! The first argument in schema is the schema definition and the 2nd one is schema options.
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], //@ Validator
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name must have less or equal to 40 characters'],
      minlength: [10, 'Tour name must have more or equal to 10 characters'],
      // validate: [validator.isAlpha, 'Name must have letters only!'] //It aslo throw errors for spaces.
      //OR -
      // validate: {
      //   validator: validator.isAlpha,
      //   message: 'Name must have letters only!'
      // }
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, `A tour must have a difficulty`],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can be between easy, medium and difficult!',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings Average must be greater or equal to 1'],
      max: [5, 'Ratings Average must be less or equal to 5'],
      set: val => val.toFixed(1), //This is a setter function
      // set: val => Math.round(val*10)/10, // 4.6666|46.666|47/10=4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //this keyword points toward current doc , Aslo this keyword is not avilable when we try to update the data present in the doc.
        //{VALUE} = val
        validator: function (val) {
          return val < this.price;
        },
        message:
          'Discounted price ({VALUE}) must be less than the regular price',
      },
      //OR- we can array aslo.
      // validate: [function (val) { return val < this.price; }, 'Discounted price must be less than the regular price!'
      // ]
    },
    summary: {
      type: String,
      trim: true, //@remove whiteSpaces from start and end of a string
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a Cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    }, //! DATA MODELING USING ADVANCE MONGOOSE -
    startLocation: {
      //@ GeoJSON - It is a special object called GeoJSON(Geospatial Data).
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //default : longitude , longitude Generally:latitude,longitude
      address: String,
      description: String,
    }, //@ Embeded Objects are defined using an array.
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ], //@ Referenced/Normalized Data Model- Child refrencing.
    // guides: Array, // Need to embed User
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User', //Even we dont need to import User model to refrence the user into tour.
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//! Virtual Properties are the ones which are not actually gets stored in database they are just defined on schema so we cant use them in querying data using find() method. These properties are used to do conversion of data. Such as ->
//@ Here we need function declaration as a callback function because we need this keyword inside this function.This function will be called each time data is fetched from database. "this" is pointing toward the current document which is being fetched from database.
//@ {toJSON: { virtuals: true },toObject: { virtuals: true }} this Schema options tells when output is as json or object then show virtual properties.

tourSchema.virtual('durationWeeks').get(function () {
  const weeks = (this.duration / 7).toFixed(1);
  return weeks.includes('.') ? +weeks : Math.trunc(+weeks);
});

//~ VIRTUAL POPULATE ->
//@ Earlier we used parent refrencing in review doc . But in Tours doesnt has the data of related reviews.
//@ Solution 1 - we could use child refrencing (array containing the ids of each related review) but this will increase the size of the tour document which is not good for performance.
//@ Solution 2 - we can manually query for reviews each time we query for tour but it would be a little cumbersome doing it manually like this.
//! Solution 3 - Using VIRTUAL POPULATE we can populate tour doc with its reviews without using child refrencing.
//@  foreignField:"tour" - Point the field where tour id is located.
//@ localField:"_id" - Point the id of the review.
//! We only want to show tour reviews when client query for a particular tour as showing all the related reviews of all tour in getAllTour query doesnt make any sense.
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//! Mongoose Middleware ->
//! There are four types of middleware in mongoose - Document , query , aggregate , and model.

//! 1. Document Middleware ->
//@ There are two document middleware - pre and post - pre runs before a document get actually saved in the db
//@ post - runs after a document gets saved in the db .
//@ Both middleware gets only triggered once a .save() or .create() methods gets executed.These are not going to run for .updateOne() or findOne() and for other methods.
//@ Also called - PRE AND POST HOOKS.
//~ post middleware dont have access of next() function

//@ Pre save Hook -> "save" is the first argument.
tourSchema.pre('save', function (next) {
  //We need to specify slug field into our schema first otherwise the newly created field will not get save into the db, as we know unspecified fields not get saved into a db.

  // console.log(this); //this keyword here is the current document which is gonna saved.
  this.slug = slugify(this.name, { lower: true });
  // console.log(this); //this keyword here is the processed document.
  next();
});
// tourSchema.post('save', function (doc, next) {
//   //This keyword is not avilable here.
//   //doc - processed document.
//   console.log(doc);
//   next();
// })
//! EMBED USER DOC INTO TOUR DOC -
//@ embedding users into an tour document is not good here , because if a user changes his role or email then we need to check for the condions that user exist or not , or it have same role or not which needs lot of unneccesary work. so we will later refrence users in tour instead embed.
// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

//! Mongoose INDEXES ->
//@ If our collection have thousands of documents then for each query mongodb needs to scan each and every document which will degrade the performance of the app. To overcome this problem we use something called indexes .
//@ Whichever field is set for index that field is taken out from each document and then mongo will create a separate file with those fields only as a index.SO whenever a query is made using that field mongo no longer need to scan all documents.
//@ By default id is set for index therefore if anyone query using id then it will take to less time to show result.
//@ Also unique fields in our schema has their default indexes.
//@ Compound indexing is aslo possible we can add all the most querred field in that index object.
//@ fields mentioned in the object aslo have their individual indexes.
//~ 1 = ascending order -1 = descending order
// tourSchema.index({ price: 1 });
// tourSchema.index({ ratingsAverage: -1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//! 2. Query Middleware ->
//@ PRE and POST FIND HOOK - Gets executed before and after a certain query is made by user.
//~ Pre query middleware -
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  //! this here points toward the QUERY OBJECT so we can chain methods here.
  //~ Even the secretTour is private but we can still access it use get tour api because in get tour controller we use findById method which is different from find hence this middleware dosent get executed. TO RUN THIS MIDDLEWARE FOR ALL TYPES OF FIND WE NEED TO USE REGULAR EXPRESSION THAT IS /^find/  IN PLACE OF FIND. OR WE CAN CREATE A NEW MIDDLEWARE SPECIFYING findById IN PLACE OF FIND WHICH IS NOT RECOMMENDED SOLUTION.
  this.start = Date.now(); //~ New property is defined in Query Object.
  this.find({ secretTour: { $ne: true } });
  next();
});

//@ Populate -
//~ .populate() replace the ObjectId of users with actual data and the output will look like that we have embed the user doc with tour but actually we havent.
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

//@ Post query middleware -
tourSchema.post(/^find/, function (docs, next) {
  //~ docs - all the documents which satisfied the result.
  console.log(
    Date.now() - this.start,
    'milliseconds was took to complete the task!'
  );
  next();
});
//! 3. Aggregation Middleware -> Used to hook before and after a aggregation is performed.
//@ PRE AND POST AGGREGATION HOOKS -
tourSchema.pre('aggregate', function (next) {
  //@ Adding a match at the begining of the this.pipeline() array -
  // this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  //@ We can add methods to aggregate objects to use them in later stages.
  // console.log(this) // point towards aggregation object.
  // console.log(this.pipeline()) // Array which was passed to aggregate pipeline
  next();
});

// tourSchema.post('aggregate',function(docs,next){

// })

//! Collection tour ->
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;

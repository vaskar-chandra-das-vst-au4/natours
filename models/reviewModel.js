const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    }, //@ Parent Refrencing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belongs to a Tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//@ Populate user and tour field of review document ->
reviewSchema.pre(/^find/, function (next) {
  //~ In get tour due to this populate function 3 times the mongoose need to populate i.e a chain of populate created which we dont want. as showing tour info in review doesnt make any sense.
  // this.populate('tour', 'name').populate('user', 'name photo');
  this.populate('user', 'name photo');

  next();
});

//! STATIC METHODS ->
//@ Avilable on current model. NOT ON CURRENT DOCUMENT LIKE INSTANCE METHOD.
//@ For aggregate method we need model so we need static method as in this method this keyword refers to current model.
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  console.log(stats);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};

//! MIDDLEWARE ->
//@ Call static method to set avg ratings and its quantity on tour documents.
reviewSchema.post('save', function () {
  //~ In Mongoose post hook -
  //@ this = current review document
  //@ Documents are instances of MODEL(constructor function).
  //@ this.constructor = current model

  this.constructor.calcAverageRatings(this.tour);
});

//! UNIQUE REVIEWS ONLY ->
//@ It might take some time to get into work.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//@ Calculate average when review got updated or deleted -
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //this keyword points to current querry.
  //for findByIdAndUpdate and findByIdAndDelete
  this.r = await this.findOne(); //Executing the query to find the current review and then store it into r property defined on the query.
  console.log(this.r); //Unaltered or not updated review document
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findOne(); //This will not work here because query is already executed at this point.
  //Here this keyword refers to current document.
  // this.r = review document this.r.constructor = Model
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

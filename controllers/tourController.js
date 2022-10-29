//! TOUR CONTROLLERS OR TOUR HANDLERS FUNCTIONS ->

//! Imports
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
// const APIFeatures = require('../utilities/apiFeatures');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const factory = require('./handlerFactory');

//! TOUR IMAGE UPLOADS ->
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not an image! Please upload only images.', 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// When mixed fields for uploading images is present we use upload.fields([])
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// One field with multiple uploads
// exports.uploadTourImages = upload.array('images', 5); --present in req.files same for upload.fields
// One field for one upload
// exports.uploadTourImages = upload.single('image'); --present in req.file

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image -
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images -
  req.body.images = [];

  // We know that async function return promise ..Here map method executing async functions in each iteration and after all iteration it returns an array containing all the promises which we need to await using Promise.all.
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});
//! Alias middleware ->
exports.aliasTopTours = (req, res, next) => {
  //@ Alias Route - localhost: 3000 / api / v1 / tours ? limit = 5 & sort=ratingsAverage,price & fields=name,price,ratingsAverage,summary,difficulty
  req.query.limit = 5;
  req.query.sort = 'ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,duration';
  next();
};

//! Handlers Functions/Controllers FOR TOURS ->

//@ 1. GET ALL TOURS ->
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   //! Instance or Object ->
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   //! Returning a document ->
//   //@ This tours is an array containing all the documents.
//   const tours = await features.query;

//   //! Sending response ->
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// });
exports.getAllTours = factory.getAll(Tour);

//@ 2. GET A TOUR ->
// exports.getTour = catchAsync(async (req, res, next) => {
//   //~ .findById(req.params.id) is a shortHand for .findOne() method.
//   // const tours = await Tour.findOne({_id : req.params.id})
//   // const tour = await Tour.findById(req.params.id).populate('guides');
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   //~ .populate('guides') replace the ObjectId of users with actual data and the output will look like that we have embed the user doc with tour but actually we havent.
//   //! This populate is transfered into a query middleware so to make our code dry.
//   // const tour = await Tour.findById(req.params.id).populate({
//   //   path: 'guides',
//   //   select: '-__v -passwordChangedAt',
//   // });
//   if (!tour) return next(new AppError('No Tour Found with that ID!', 404));

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.getTour = factory.getOne(Tour, 'reviews');

//@ 3. POST A TOUR ->
// exports.createTour = catchAsync(async (req, res, next) => {
//   //! This method is directly called on Tour Object and then created a new document unlike .save(). It returns a promise so we need to handle that .
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       newTour,
//     },
//   });
// });
exports.createTour = factory.createOne(Tour);
//@ 4. UPDATE A TOUR ->
// exports.updateTour = catchAsync(async (req, res, next) => {
//   //! new:true will return updated document.

//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true, //this ensures to run validators while updating tours.
//   });
//   if (!tour) return next(new AppError('No Tour Found with that ID!', 404));
//   res.status(200).json({
//     status: 'success',
//     data: tour,
//   });
// });
exports.updateTour = factory.updateOne(Tour);
//@ 5. DELETE A TOUR ->
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) return next(new AppError('No Tour Found with that ID!', 404));
//   res.status(204).json({
//     status: 'success',
//     message: 'null',
//   });
// });
exports.deleteTour = factory.deleteOne(Tour);

//! Aggregation operations process multiple documents and return computed results. You can use aggregation operations to:
//@ Group values from multiple documents together.
//@ Perform operations on the grouped data to return a single result.
//@ Analyze data changes over time.
//@ To perform aggregation operations, you can use:
//@ Aggregation pipelines which are the preferred method for performing aggregations.
//!~ Aggregation Pipelines - An aggregation pipeline consists of one or more stages that process documents:
//@ Each stage performs an operation on the input documents.For example, a stage can filter documents, group documents, and calculate values.
//@ The documents that are output from a stage are passed to the next stage.
//@ An aggregation pipeline can return results for groups of documents.For example, return the total, average, maximum, and minimum values.
//~ Note -
//@ Tour.aggregate() returns aggregate Object which needs to await to get result.
//@  $match: { ratingsAverage: { $gte: 4.5 } } This is Noraml query like find()
//@ It needs to be null if we dont want to group data according to any field -  _id: null
//@ $sort: { avgPrice: 1 } - '1' for ass "-1" for des.
//@ 6. Aggregation Pipeline ->
exports.getToursStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: null,
        // _id: '$difficulty',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numReviews: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: "EASY" } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

//@ 7. Monthly Tour Statistics ->
//! {$unwind: '$startDates' }- Use to destructure documents on the basis of elements present in an array
//! { tours: { $push: '$name' }}- Generate a new array.
//! { $addFields : {month : '$_id'} } - add Fields
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTours: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitutde and longitude in the format lat,lng.'
      ),
      400
    );
  //@ This radius obtained by dividing distance provided by earth's radius.
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  // console.log(radius);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitutde and longitude in the format lat,lng.'
      ),
      400
    );

  //@ Geospatial aggregation contains only one stage called geoNear and this need to be very firt in the aggregation pipeline
  //@ geoNear need atleast one field contains geospatial index . startLocation is a geospatial index '2dsphere.
  // @ geoNear take bunch of options in which key is one option which is optional if our data has only one 2d or 2dsphere geospatial index if not then we need to specify which index we want to use to calculate distances.
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

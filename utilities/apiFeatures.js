class APIFeatures {
  constructor(query, queryString) {
    // query from mongoose must not be awaited before
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // ! NOTE -
    // JSON.parse(JSON_OBJECT) - convert json obj into javascript obj. { price: { gte: '8999' } }
    // JSON.stringify(JS_OBJECT) - convert js obj into json obj. {"price":{"$gte":"8999"}}

    // req.query object is the data after "?"
    // .find() method return a query object of mongoose which we need to manipulate before awaiting that, using req.query so that we can query using some conditions specified by an user.

    // console.log(this.queryString);
    const queryObj = { ...this.queryString };
    const excludedFields = ['sort', 'page', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      console.log(this.queryString);
      const sortBy = this.queryString.sort.split(',').join(' ');
      console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else this.query = this.query.sort('-createdAt');

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else this.query = this.query.select('-__v');

    return this;
  }

  paginate() {
    // limit = result per page.
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;

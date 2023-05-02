//@ This function helps to avoid try-catch block , whenever this function is called it returns a function which have exact same paramter
module.exports = fn => {
  return (req, res, next) => fn(req, res, next).catch(next);
};

// catch(next) means .catch(err => next(err))

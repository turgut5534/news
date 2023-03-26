const checkFields = (req, res, next) => {

    const { title } = req.body
    console.log(title)
    if (req.body.title && req.body.description) {
  
        // Required fields are present, move to next middleware
        next();
    } else {
        // Required fields are missing, return error response

        res.status(400).json({ message: 'Title and description are required' });
    }
};

module.exports = checkFields;
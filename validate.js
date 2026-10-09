const mongoose = require('mongoose');

// Reject malformed ObjectIds before they reach the database
exports.validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }
  next();
};

// Body must be a non-empty JSON object (create / update)
exports.requireBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body cannot be empty' });
  }
  next();
};

// Stock adjustment: { "change": <non-zero integer> }
exports.validateStockChange = (req, res, next) => {
  const { change } = req.body || {};
  if (!Number.isInteger(change) || change === 0) {
    return res.status(400).json({ error: '"change" must be a non-zero integer (positive = restock, negative = sale)' });
  }
  next();
};

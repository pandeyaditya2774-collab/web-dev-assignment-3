exports.notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ error: `Duplicate value: ${field} already exists` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};

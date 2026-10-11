function requireJson(req, res, next) {
  const contentType = req.get('Content-Type') || '';
  if (contentType.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return res.status(400).json({
      error: { code: 'INVALID_CONTENT_TYPE', message: 'Content-Type application/json olmalıdır.' },
    });
  }
  next();
}

module.exports = requireJson;

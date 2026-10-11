function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'İstek gövdesi geçerli JSON olmalıdır.' },
    });
  }
  if (error.type === 'entity.too.large') {
    return res.status(400).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'İstek gövdesi 100 KB sınırını aşıyor.' },
    });
  }
  if (['charset.unsupported', 'encoding.unsupported', 'request.aborted', 'request.size.invalid'].includes(error.type)) {
    return res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: 'İstek gövdesi veya kodlaması geçersiz.' },
    });
  }
  if (error.status === 400 || error.status === 404) {
    const response = { code: error.code || 'INVALID_REQUEST', message: error.message };
    if (error.details) response.details = error.details;
    return res.status(error.status).json({ error: response });
  }

  console.error('TASKFLOW sunucu hatası:', error);
  return res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Sunucu hatası oluştu.' },
  });
}

module.exports = errorHandler;

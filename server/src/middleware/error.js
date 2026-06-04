export function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Không tìm thấy: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  let message = err.message || 'Lỗi máy chủ';
  if (err.code === 11000) {
    message = 'Dữ liệu đã tồn tại (trùng lặp)';
    return res.status(409).json({ success: false, message });
  }
  res.status(status).json({ success: false, message });
}

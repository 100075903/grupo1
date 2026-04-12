export class AppError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {string} [code]
   */
  constructor(statusCode, message, code) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
}

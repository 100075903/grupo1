import { validationResult } from "express-validator";

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validación fallida",
      details: errors.array(),
    });
    return;
  }
  next();
}

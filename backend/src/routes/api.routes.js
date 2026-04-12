import { Router } from "express";
import { body, param, query } from "express-validator";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller.js";
import * as familiaController from "../controllers/familia.controller.js";
import * as listaController from "../controllers/lista.controller.js";
import * as productoController from "../controllers/producto.controller.js";
import * as precioController from "../controllers/precio.controller.js";
import * as tiendaController from "../controllers/tienda.controller.js";
import * as historialController from "../controllers/historial.controller.js";
import * as notificacionController from "../controllers/notificacion.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import {
  requireFamiliaMember,
  requireListaFamiliaMember,
} from "../middleware/requireFamiliaMember.js";
import { requireSelfUsuario } from "../middleware/requireSelf.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();
router.use(apiLimiter);

router.post(
  "/auth/register",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 8, max: 128 }),
    body("nombre").isString().trim().isLength({ min: 1, max: 120 }),
  ],
  validate,
  asyncHandler(authController.register)
);

router.post(
  "/auth/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 1, max: 128 }),
  ],
  validate,
  asyncHandler(authController.login)
);

router.use(requireAuth);

router.post(
  "/familias",
  [body("nombre").isString().trim().isLength({ min: 1, max: 120 })],
  validate,
  asyncHandler(familiaController.crear)
);

router.post(
  "/familias/unirse",
  [body("codigo").isString().trim().isLength({ min: 4, max: 32 })],
  validate,
  asyncHandler(familiaController.unirse)
);

router.get(
  "/familias/:familia_id/miembros",
  [param("familia_id").isString().notEmpty()],
  validate,
  requireFamiliaMember(),
  asyncHandler(familiaController.miembros)
);

router.get(
  "/listas/:familia_id",
  [param("familia_id").isString().notEmpty()],
  validate,
  requireFamiliaMember(),
  asyncHandler(listaController.porFamilia)
);

router.post(
  "/listas/:lista_id/productos",
  [
    param("lista_id").isString().notEmpty(),
    body("nombre").isString().trim().isLength({ min: 1, max: 300 }),
    body("cantidad").optional().isFloat({ min: 0.01 }),
    body("notas").optional().isString().isLength({ max: 500 }),
    body("barcode").optional().isString().isLength({ max: 64 }),
  ],
  validate,
  requireListaFamiliaMember,
  asyncHandler(listaController.agregarProducto)
);

router.patch(
  "/listas/:lista_id/productos/:id",
  [
    param("lista_id").isString().notEmpty(),
    param("id").isString().notEmpty(),
    body("nombre").optional().isString().trim().isLength({ min: 1, max: 300 }),
    body("cantidad").optional().isFloat({ min: 0.01 }),
    body("notas").optional().isString().isLength({ max: 500 }),
    body("completado").optional().isBoolean(),
  ],
  validate,
  requireListaFamiliaMember,
  asyncHandler(listaController.actualizarProducto)
);

router.delete(
  "/listas/:lista_id/productos/:id",
  [param("lista_id").isString().notEmpty(), param("id").isString().notEmpty()],
  validate,
  requireListaFamiliaMember,
  asyncHandler(listaController.eliminarProducto)
);

router.get(
  "/productos/barcode/:codigo",
  [param("codigo").isString().trim().notEmpty()],
  validate,
  asyncHandler(productoController.porBarcode)
);

router.get(
  "/productos/buscar",
  [
    query("q").isString().trim().isLength({ min: 1, max: 200 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  asyncHandler(productoController.buscar)
);

router.get(
  "/precios",
  [
    query("lat").notEmpty(),
    query("lng").notEmpty(),
    query("q").optional({ values: "null" }).isString().trim().isLength({ max: 200 }),
    query("radio_km").optional().isFloat({ min: 0.1 }),
  ],
  validate,
  asyncHandler(precioController.comparar)
);

router.post(
  "/precios/reportar",
  [
    body("productoId").isString().notEmpty(),
    body("tiendaId").isString().notEmpty(),
    body("precio").isFloat({ min: 0 }),
    body("lat").optional().isFloat(),
    body("lng").optional().isFloat(),
  ],
  validate,
  asyncHandler(precioController.reportar)
);

router.get(
  "/tiendas",
  [
    query("lat").notEmpty(),
    query("lng").notEmpty(),
    query("radio_km").optional().isFloat({ min: 0.1 }),
    query("tipo").optional().isString().isLength({ max: 80 }),
    query("solo_abiertos").optional().isIn(["true", "false", "0", "1"]),
  ],
  validate,
  asyncHandler(tiendaController.listar)
);

router.post(
  "/tiendas/:tienda_id/reseñas",
  [
    param("tienda_id").isString().notEmpty(),
    body("rating").isInt({ min: 1, max: 5 }),
    body("comentario").optional().isString().isLength({ max: 2000 }),
  ],
  validate,
  asyncHandler(tiendaController.resena)
);

router.get(
  "/historial/:familia_id/frecuentes",
  [param("familia_id").isString().notEmpty()],
  validate,
  requireFamiliaMember(),
  asyncHandler(historialController.frecuentes)
);

router.post(
  "/historial/:familia_id/guardar",
  [
    param("familia_id").isString().notEmpty(),
    body("items").isArray({ min: 1 }),
    body("items.*.productoNombre").isString().trim().isLength({ min: 1, max: 500 }),
    body("items.*.cantidad").optional().isFloat({ min: 0.01 }),
    body("items.*.metadata").optional().isString().isLength({ max: 2000 }),
  ],
  validate,
  requireFamiliaMember(),
  asyncHandler(historialController.guardar)
);

router.get(
  "/historial/:familia_id",
  [
    param("familia_id").isString().notEmpty(),
    query("limit").optional().isInt({ min: 1, max: 200 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  validate,
  requireFamiliaMember(),
  asyncHandler(historialController.listar)
);

router.get(
  "/notificaciones/:usuario_id",
  [param("usuario_id").isString().notEmpty()],
  validate,
  requireSelfUsuario,
  asyncHandler(notificacionController.listar)
);

router.patch(
  "/notificaciones/:usuario_id/leer",
  [
    param("usuario_id").isString().notEmpty(),
    body("ids").optional().isArray(),
    body("ids.*").optional().isString().notEmpty(),
  ],
  validate,
  requireSelfUsuario,
  asyncHandler(notificacionController.marcarLeidas)
);

export default router;

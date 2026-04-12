import * as historialService from "../services/historial.service.js";

export async function listar(req, res) {
  const data = await historialService.listarHistorial(
    req.params.familia_id,
    req.query.limit,
    req.query.offset
  );
  res.json(data);
}

export async function frecuentes(req, res) {
  const rows = await historialService.productosFrecuentes(req.params.familia_id);
  res.json(rows);
}

export async function guardar(req, res) {
  const data = await historialService.guardarHistorial(
    req.params.familia_id,
    req.body.items
  );
  res.status(201).json(data);
}

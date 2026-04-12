import * as familiaService from "../services/familia.service.js";

export async function crear(req, res) {
  const familia = await familiaService.crearFamilia(req.userId, req.body.nombre);
  res.status(201).json(familia);
}

export async function unirse(req, res) {
  const familia = await familiaService.unirseFamilia(req.userId, req.body.codigo);
  res.json(familia);
}

export async function miembros(req, res) {
  const rows = await familiaService.miembrosFamilia(req.params.familia_id);
  res.json(rows);
}

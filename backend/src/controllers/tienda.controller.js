import * as tiendaService from "../services/tienda.service.js";

export async function listar(req, res) {
  const rows = await tiendaService.listarTiendas({
    lat: req.query.lat,
    lng: req.query.lng,
    radio_km: req.query.radio_km,
    tipo: req.query.tipo,
    solo_abiertos: req.query.solo_abiertos,
  });
  res.json(rows);
}

export async function resena(req, res) {
  const row = await tiendaService.crearResena(req.userId, req.params.tienda_id, req.body);
  res.status(201).json(row);
}

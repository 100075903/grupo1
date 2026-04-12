import * as precioService from "../services/precio.service.js";

export async function comparar(req, res) {
  const rows = await precioService.compararPrecios({
    q: req.query.q,
    lat: req.query.lat,
    lng: req.query.lng,
    radio_km: req.query.radio_km,
  });
  res.json(rows);
}

export async function reportar(req, res) {
  const row = await precioService.reportarPrecio(req.userId, req.body);
  res.status(201).json(row);
}

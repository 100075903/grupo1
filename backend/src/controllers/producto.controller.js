import * as productoService from "../services/producto.service.js";

export async function porBarcode(req, res) {
  const data = await productoService.productoPorBarcode(req.params.codigo);
  res.json(data);
}

export async function buscar(req, res) {
  const rows = await productoService.buscarProductos(
    req.query.q,
    req.query.limit
  );
  res.json(rows);
}

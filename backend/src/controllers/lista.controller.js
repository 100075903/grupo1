import * as listaService from "../services/lista.service.js";

export async function porFamilia(req, res) {
  const listas = await listaService.listasPorFamilia(req.params.familia_id);
  res.json(listas);
}

export async function agregarProducto(req, res) {
  const row = await listaService.agregarProductoLista(req.params.lista_id, req.body);
  res.status(201).json(row);
}

export async function actualizarProducto(req, res) {
  const row = await listaService.actualizarProductoLista(
    req.params.lista_id,
    req.params.id,
    req.body
  );
  res.json(row);
}

export async function eliminarProducto(req, res) {
  await listaService.eliminarProductoLista(req.params.lista_id, req.params.id);
  res.status(204).send();
}

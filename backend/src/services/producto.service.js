import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

const OFF_BASE = "https://world.openfoodfacts.org/api/v2/product";

async function fetchOpenFoodFacts(barcode) {
  const url = `${OFF_BASE}/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url, { headers: { "User-Agent": "AppMovilBackend/1.0" } });
  if (!res.ok) throw new AppError(502, "Servicio de códigos no disponible");
  return res.json();
}

export async function productoPorBarcode(codigo) {
  const code = codigo.trim();
  if (!code) throw new AppError(400, "Código inválido");

  const local = await prisma.producto.findUnique({
    where: { barcode: code },
  });
  if (local) return { fuente: "local", producto: local };

  const off = await fetchOpenFoodFacts(code);
  if (off.status !== 1 || !off.product) {
    throw new AppError(404, "Producto no encontrado para este código");
  }

  const p = off.product;
  const nombre =
    p.product_name || p.generic_name || p.product_name_en || "Sin nombre";
  const marca = p.brands?.split(",")?.[0]?.trim() || null;
  const imagenUrl = p.image_url || p.image_front_url || null;

  const producto = await prisma.producto.create({
    data: {
      barcode: code,
      nombre: String(nombre).slice(0, 500),
      marca: marca ? String(marca).slice(0, 200) : null,
      imagenUrl: imagenUrl ? String(imagenUrl).slice(0, 2000) : null,
    },
  });

  return { fuente: "openfoodfacts", producto };
}

export async function buscarProductos(q, limit = 20) {
  const term = (q || "").trim();
  if (!term) return [];

  const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const lower = term.toLowerCase();

  const rows = await prisma.producto.findMany({
    take: take * 4,
    orderBy: { createdAt: "desc" },
  });

  return rows
    .filter(
      (r) =>
        r.nombre.toLowerCase().includes(lower) ||
        (r.marca && r.marca.toLowerCase().includes(lower))
    )
    .slice(0, take);
}

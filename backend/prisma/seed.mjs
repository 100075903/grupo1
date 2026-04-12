import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Santo Domingo Este — coordenadas de referencia */
const LAT = 18.4861;
const LNG = -69.9312;

async function main() {
  const existentes = await prisma.tienda.count();
  if (existentes > 0) {
    console.log("Seed omitido: ya hay tiendas en la base.");
    return;
  }

  const tiendas = await prisma.$transaction([
    prisma.tienda.create({
      data: {
        nombre: "Nacional Supermarket",
        tipo: "supermercado",
        lat: LAT + 0.01,
        lng: LNG + 0.005,
        direccion: "Av. San Vicente de Paul, SDE",
        horario: "Lun–Dom 7am–10pm",
        abiertoAhora: true,
      },
    }),
    prisma.tienda.create({
      data: {
        nombre: "La Sirena",
        tipo: "supermercado",
        lat: LAT - 0.008,
        lng: LNG + 0.012,
        direccion: "Av. Las Américas Km 8, SDE",
        horario: "Lun–Dom 8am–9pm",
        abiertoAhora: true,
      },
    }),
    prisma.tienda.create({
      data: {
        nombre: "Jumbo",
        tipo: "hipermercado",
        lat: LAT + 0.015,
        lng: LNG - 0.01,
        direccion: "Av. Charles de Gaulle, SDE",
        horario: "24 horas",
        abiertoAhora: true,
      },
    }),
  ]);

  const arroz = await prisma.producto.create({
    data: {
      barcode: "7622210100054",
      nombre: "Arroz Cristal 5 lbs",
      marca: "Cristal",
    },
  });

  const leche = await prisma.producto.create({
    data: {
      barcode: "7750506800114",
      nombre: "Leche Nestlé Entera 1L",
      marca: "Nestlé",
    },
  });

  for (const t of tiendas) {
    await prisma.precioReporte.create({
      data: {
        productoId: arroz.id,
        tiendaId: t.id,
        precio: 195 + Math.floor(Math.random() * 40),
      },
    });
    await prisma.precioReporte.create({
      data: {
        productoId: leche.id,
        tiendaId: t.id,
        precio: 75 + Math.floor(Math.random() * 25),
      },
    });
  }

  console.log("Seed OK: tiendas y precios de ejemplo.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

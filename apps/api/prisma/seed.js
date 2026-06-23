const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
const DAY = 86400000;

(async () => {
  await p.movimiento.deleteMany();
  await p.detalleEscandallo.deleteMany();
  await p.detalleSalida.deleteMany();
  await p.detalleEntrada.deleteMany();
  await p.salida.deleteMany();
  await p.entrada.deleteMany();
  await p.producto.deleteMany();
  await p.plato.deleteMany();
  await p.proveedor.deleteMany();
  await p.usuario.deleteMany();

  // Usuario admin por defecto
  const hash = await bcrypt.hash('admin123', 10);
  const admin = await p.usuario.create({
    data: { email: 'admin@restaurante.es', passwordHash: hash, nombre: 'Administrador', rol: 'ADMIN' },
  });
  const hash2 = await bcrypt.hash('cocina123', 10);
  const cocinero = await p.usuario.create({
    data: { email: 'cocina@restaurante.es', passwordHash: hash2, nombre: 'Jefe de Cocina', rol: 'COCINERO' },
  });

  const prov = await p.proveedor.create({
    data: { nombre: 'Cárnicas García', telefono: '911234567', email: 'ventas@carnicasgarcia.es' },
  });
  const prov2 = await p.proveedor.create({ data: { nombre: 'Frutas y Verduras López', telefono: '912345678' } });
  await p.proveedor.create({ data: { nombre: 'Distribuciones Chef S.A.' } });

  const lomo = await p.producto.create({
    data: { nombre: 'Lomo de cerdo', categoria: 'Carnes', unidad: 'KG', pesoUnitario: 1000, precioUnitario: 12, stockMinimo: 2, stockActual: 7.5, fechaCaducidad: new Date(Date.now() + 5 * DAY), proveedorId: prov.id },
  });
  const solomillo = await p.producto.create({
    data: { nombre: 'Solomillo', categoria: 'Carnes', unidad: 'KG', pesoUnitario: 1000, precioUnitario: 18, stockMinimo: 3, stockActual: 1.2, proveedorId: prov.id },
  });
  const patata = await p.producto.create({
    data: { nombre: 'Patata', categoria: 'Verduras', unidad: 'KG', pesoUnitario: 1000, precioUnitario: 1.5, stockMinimo: 5, stockActual: 20, fechaCaducidad: new Date(Date.now() + 30 * DAY), proveedorId: prov2.id },
  });
  const aceite = await p.producto.create({
    data: { nombre: 'Aceite de oliva', categoria: 'Despensa', unidad: 'L', pesoUnitario: 1000, precioUnitario: 4, stockMinimo: 4, stockActual: 2 },
  });
  await p.producto.create({
    data: { nombre: 'Leche entera', categoria: 'Lácteos', unidad: 'L', pesoUnitario: 1000, precioUnitario: 0.9, stockMinimo: 3, stockActual: 8, fechaCaducidad: new Date(Date.now() - 1 * DAY), proveedorId: prov.id },
  });

  // Escandallo de ejemplo: Solomillo con guarnición (2 raciones, 24 €)
  const plato = await p.plato.create({
    data: { nombre: 'Solomillo con guarnición', numRaciones: 2, precioVenta: 24 },
  });
  await p.detalleEscandallo.createMany({
    data: [
      { platoId: plato.id, productoId: solomillo.id, cantidad: 300, mermaPorcentaje: 0 },
      { platoId: plato.id, productoId: patata.id, cantidad: 400, mermaPorcentaje: 20 },
      { platoId: plato.id, productoId: aceite.id, cantidad: 20, mermaPorcentaje: 0 },
    ],
  });

  // Entrada de ejemplo
  const entrada = await p.entrada.create({ data: { fecha: new Date(), numeroFactura: 'F-2026-001', proveedorId: prov.id } });
  await p.detalleEntrada.create({ data: { entradaId: entrada.id, productoId: lomo.id, cantidad: 10, precioCompra: 12 } });
  await p.movimiento.create({ data: { productoId: lomo.id, fecha: new Date(), tipo: 'ENTRADA', cantidad: 10, stockResultante: 10, referencia: entrada.id } });

  console.log((await p.producto.count()) + ' productos, ' + (await p.proveedor.count()) + ' proveedores, ' + (await p.plato.count()) + ' plato, ' + (await p.entrada.count()) + ' entrada, ' + (await p.usuario.count()) + ' usuarios');
  await p.$disconnect();
})();
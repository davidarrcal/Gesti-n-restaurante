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
  await p.restaurante.deleteMany();

  // Restaurante de ejemplo
  const restaurante = await p.restaurante.create({ data: { nombre: 'Restaurante Demo' } });
  const rid = restaurante.id;

  // Usuarios
  const hash = await bcrypt.hash('admin123', 10);
  await p.usuario.create({
    data: { email: 'admin@restaurante.es', passwordHash: hash, nombre: 'Administrador', rol: 'ADMIN', restauranteId: rid },
  });
  const hash2 = await bcrypt.hash('cocina123', 10);
  await p.usuario.create({
    data: { email: 'cocina@restaurante.es', passwordHash: hash2, nombre: 'Jefe de Cocina', rol: 'COCINERO', restauranteId: rid },
  });

  const prov = await p.proveedor.create({
    data: { nombre: 'Cárnicas García', telefono: '911234567', email: 'ventas@carnicasgarcia.es', restauranteId: rid },
  });
  const prov2 = await p.proveedor.create({ data: { nombre: 'Frutas y Verduras López', telefono: '912345678', restauranteId: rid } });
  await p.proveedor.create({ data: { nombre: 'Distribuciones Chef S.A.', restauranteId: rid } });

  const lomo = await p.producto.create({
    data: { nombre: 'Lomo de cerdo', categoria: 'Carnes', unidad: 'KG', pesoUnitario: 1000, precioUnitario: 12, stockMinimo: 2, stockActual: 7.5, fechaCaducidad: new Date(Date.now() + 5 * DAY), proveedorId: prov.id, restauranteId: rid },
  });
  const solomillo = await p.producto.create({
    data: { nombre: 'Solomillo', categoria: 'Carnes', unidad: 'KG', pesoUnitario: 1000, precioUnitario: 18, stockMinimo: 3, stockActual: 1.2, proveedorId: prov.id, restauranteId: rid },
  });
  const patata = await p.producto.create({
    data: { nombre: 'Patata', categoria: 'Verduras', unidad: 'KG', pesoUnitario: 1000, precioUnitario: 1.5, stockMinimo: 5, stockActual: 20, fechaCaducidad: new Date(Date.now() + 30 * DAY), proveedorId: prov2.id, restauranteId: rid },
  });
  const aceite = await p.producto.create({
    data: { nombre: 'Aceite de oliva', categoria: 'Despensa', unidad: 'L', pesoUnitario: 1000, precioUnitario: 4, stockMinimo: 4, stockActual: 2, restauranteId: rid },
  });
  await p.producto.create({
    data: { nombre: 'Leche entera', categoria: 'Lácteos', unidad: 'L', pesoUnitario: 1000, precioUnitario: 0.9, stockMinimo: 3, stockActual: 8, fechaCaducidad: new Date(Date.now() - 1 * DAY), proveedorId: prov.id, restauranteId: rid },
  });

  // Escandallo de ejemplo
  const plato = await p.plato.create({
    data: { nombre: 'Solomillo con guarnición', numRaciones: 2, precioVenta: 24, restauranteId: rid },
  });
  await p.detalleEscandallo.createMany({
    data: [
      { platoId: plato.id, productoId: solomillo.id, cantidad: 300, mermaPorcentaje: 0 },
      { platoId: plato.id, productoId: patata.id, cantidad: 400, mermaPorcentaje: 20 },
      { platoId: plato.id, productoId: aceite.id, cantidad: 20, mermaPorcentaje: 0 },
    ],
  });

  // Entrada de ejemplo
  const entrada = await p.entrada.create({ data: { fecha: new Date(), numeroFactura: 'F-2026-001', proveedorId: prov.id, restauranteId: rid } });
  await p.detalleEntrada.create({ data: { entradaId: entrada.id, productoId: lomo.id, cantidad: 10, precioCompra: 12 } });
  await p.movimiento.create({ data: { productoId: lomo.id, fecha: new Date(), tipo: 'ENTRADA', cantidad: 10, stockResultante: 10, referencia: entrada.id, restauranteId: rid } });

  const count = await p.producto.count({ where: { restauranteId: rid } });
  console.log(count + ' productos, ' + (await p.proveedor.count({ where: { restauranteId: rid } })) + ' proveedores, ' + (await p.plato.count({ where: { restauranteId: rid } })) + ' plato, ' + (await p.entrada.count({ where: { restauranteId: rid } })) + ' entrada, ' + (await p.usuario.count({ where: { restauranteId: rid } })) + ' usuarios');
  await p.$disconnect();
})();
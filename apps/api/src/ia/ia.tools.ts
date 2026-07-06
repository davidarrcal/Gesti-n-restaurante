export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'listar_productos',
      description:
        'Lista todos los productos del inventario. Devuelve nombre, categoría, unidad, stock actual, stock mínimo, precio y proveedor.',
      parameters: {
        type: 'object',
        properties: {
          q: {
            type: 'string',
            description: 'Texto de búsqueda (nombre o categoría)',
          },
          categoria: {
            type: 'string',
            description: 'Filtrar por categoría exacta',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'obtener_producto',
      description:
        'Obtiene el detalle de un producto por su ID, incluyendo proveedor e historial de movimientos.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID del producto' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_producto',
      description:
        'Crea un nuevo producto en el inventario. Requiere permisos de cocinero o superior.',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          categoria: { type: 'string' },
          unidad: {
            type: 'string',
            enum: ['KG', 'G', 'L', 'ML', 'UDS'],
            description: 'Unidad de medida del producto',
          },
          pesoUnitario: {
            type: 'number',
            description: 'Peso en gramos o mL por unidad',
          },
          precioUnitario: {
            type: 'number',
            description: 'Precio por unidad de medida (€)',
          },
          stockMinimo: { type: 'number' },
          fechaCaducidad: {
            type: 'string',
            format: 'date',
            description: 'Fecha de caducidad (ISO)',
          },
          proveedorId: { type: 'string' },
        },
        required: ['nombre', 'unidad', 'pesoUnitario', 'precioUnitario'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'actualizar_producto',
      description:
        'Actualiza los datos de un producto existente. Requiere permisos de cocinero o superior.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nombre: { type: 'string' },
          categoria: { type: 'string' },
          precioUnitario: { type: 'number' },
          stockMinimo: { type: 'number' },
          fechaCaducidad: { type: 'string', format: 'date' },
          proveedorId: { type: 'string' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_proveedores',
      description: 'Lista todos los proveedores del restaurante.',
      parameters: {
        type: 'object',
        properties: {
          q: {
            type: 'string',
            description: 'Texto de búsqueda (nombre o email)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'registrar_entrada',
      description:
        'Registra una entrada de mercancía (compra). Actualiza el stock de los productos y crea movimientos. Requiere permisos de cocinero o superior.',
      parameters: {
        type: 'object',
        properties: {
          proveedorId: { type: 'string' },
          numeroFactura: { type: 'string' },
          lineas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productoId: { type: 'string' },
                cantidad: { type: 'number' },
                precioCompra: { type: 'number' },
              },
              required: ['productoId', 'cantidad', 'precioCompra'],
            },
            description: 'Líneas de la entrada con producto, cantidad y precio',
          },
        },
        required: ['lineas'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'registrar_salida',
      description:
        'Registra una salida de inventario (consumo, merma, rotura). Descuenta stock y crea movimientos. Requiere permisos de cocinero o superior.',
      parameters: {
        type: 'object',
        properties: {
          motivo: {
            type: 'string',
            enum: ['ELABORACION', 'MERMA', 'ROTURA', 'INVENTARIO', 'OTRO'],
          },
          motivoTexto: { type: 'string', description: 'Descripción del motivo' },
          platoId: { type: 'string', description: 'ID del plato asociado' },
          lineas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productoId: { type: 'string' },
                cantidad: { type: 'number' },
              },
              required: ['productoId', 'cantidad'],
            },
          },
        },
        required: ['lineas'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_entradas',
      description:
        'Lista el historial de entradas (compras). Se puede filtrar por fecha y proveedor.',
      parameters: {
        type: 'object',
        properties: {
          desde: { type: 'string', format: 'date' },
          hasta: { type: 'string', format: 'date' },
          proveedorId: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_salidas',
      description:
        'Lista el historial de salidas (consumos). Se puede filtrar por fecha y plato.',
      parameters: {
        type: 'object',
        properties: {
          desde: { type: 'string', format: 'date' },
          hasta: { type: 'string', format: 'date' },
          platoId: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_platos',
      description:
        'Lista todos los platos con su coste por ración, margen y food cost calculados.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'obtener_plato',
      description:
        'Obtiene el detalle de un plato (escandallo) con todas sus líneas de ingredientes y cálculos.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID del plato' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_plato',
      description:
        'Crea un nuevo plato con su escandallo (líneas de ingredientes). Requiere permisos de cocinero o superior.',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          numRaciones: { type: 'integer', minimum: 1 },
          precioVenta: { type: 'number' },
          lineas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productoId: { type: 'string' },
                cantidad: {
                  type: 'number',
                  description: 'Cantidad neta por ración en subunidad (g, mL, uds)',
                },
                mermaPorcentaje: {
                  type: 'number',
                  description: 'Porcentaje de merma (%)',
                },
              },
              required: ['productoId', 'cantidad'],
            },
          },
        },
        required: ['nombre', 'numRaciones', 'precioVenta', 'lineas'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'obtener_alertas',
      description:
        'Obtiene las alertas de stock bajo el mínimo, productos próximos a caducar y caducados.',
      parameters: {
        type: 'object',
        properties: {
          diasProximo: {
            type: 'integer',
            description: 'Días para considerar próximo a caducar',
            default: 7,
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'obtener_metricas',
      description:
        'Obtiene las métricas del dashboard: contadores, valor de inventario, alertas resumen y últimos movimientos.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generar_informe',
      description:
        'Genera un informe de movimientos, escandallos o caducidades. Requiere permisos de gerente o admin.',
      parameters: {
        type: 'object',
        properties: {
          tipo: {
            type: 'string',
            enum: ['movimientos', 'escandallos', 'caducidades'],
          },
          productoId: {
            type: 'string',
            description: 'Obligatorio para informe de movimientos',
          },
          desde: { type: 'string', format: 'date' },
          hasta: { type: 'string', format: 'date' },
        },
        required: ['tipo'],
      },
    },
  },
];
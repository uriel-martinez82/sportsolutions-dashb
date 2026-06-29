export interface OVRecord {
  /** Índice 1-based de la fila en Google Sheets (incluye la fila de encabezado) */
  _rowIndex?: number;
  NUM_OV: string;
  NUM_OC: string;
  SKU: string;
  DESCRIPCION: string;
  FABRICANTE: string;
  MARCA: string;
  LINEA_PRODUCTO: string;
  NOMBRE_PROVEEDOR: string;
  CLIENTE: string;
  CANTIDAD: string;
  ESTADO: string;
  ALMACEN: string;
  SERIE: string;
  FECHA_ENTREGA_CLIENTE: string;
  STATUS: string;
  PRECIO_UNITARIO: string;
  MONEDA: string;
  OBSERVACIONES: string;
}

export interface OCDetalle {
  NUM_OC: string;
  CANTIDAD_COMPRADA: number;
  CANTIDAD_DISPONIBLE: number;
  CANTIDAD_APARTADA: number;
  PRECIO_UNITARIO: string;
  PRECIO_FOB: string;
  MONEDA: string;
  FECHA_OC: string;
  FECHA_EMBARQUE: string;
  FECHA_LLEGADA_BODEGA: string;
  ESTADO: string;
  ALMACEN: string;
  OBSERVACIONES: string;
}

export interface InventarioItem {
  SKU: string;
  DESCRIPCION: string;
  FABRICANTE: string;
  NOMBRE_PROVEEDOR: string;
  MARCA: string;
  LINEA_PRODUCTO: string;
  ALMACEN: string;
  CANTIDAD_COMPRADA: number;
  CANTIDAD_DISPONIBLE: number;
  CANTIDAD_APARTADA: number;
  OCS: OCDetalle[];
}

export interface OverviewStats {
  totalComprado: number;
  totalDisponible: number;
  totalApartado: number;
  totalOVsPendientes: number;
  totalSKUs: number;
  totalOCs: number;
}

export interface DashboardData {
  ovsPendientes: OVRecord[];
  inventario: InventarioItem[];
  overview: OverviewStats;
}

/** OVs agrupadas por NUM_OV para la vista de tabla principal */
export interface OVGrouped {
  NUM_OV: string;
  CLIENTE: string;
  skus: OVRecord[];
  totalUnidades: number;
  statuses: string[];
  fechaEntrega: string;
}

/** Datos de una OC de COMPRAS con stock disponible para asignación */
export interface CompraDisponible {
  rowIndexInSheet: number;
  NUM_OC: string;
  ALMACEN: string;
  CANTIDAD_DISPONIBLE: number;
  CANTIDAD_APARTADA: number;
  PRECIO_UNITARIO: string;
  MONEDA: string;
}

/** Payload que abre el modal de asignación */
export interface AsignacionTarget {
  sku: string;
  descripcion: string;
  fabricante: string;
  marca: string;
  lineaProducto: string;
  nombreProveedor: string;
  numOV: string;
  cliente: string;
  almacen: string;
  fechaEntrega: string;
  moneda: string;
  cantidadRequerida: number;
  ventaRowIndex: number;
  isReAsignacion: boolean;
}

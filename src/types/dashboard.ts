export interface CompraRecord {
  NUM_OC: string;
  SKU: string;
  DESCRIPCION: string;
  FABRICANTE: string;
  MARCA: string;
  LINEA_PRODUCTO: string;
  NOMBRE_PROVEEDOR: string;
  FAMILIA: string;
  CATEGORIA_PRODUCTO: string;
  CANTIDAD_COMPRADA: string;
  CANTIDAD_DISPONIBLE: string;
  CANTIDAD_APARTADA: string;
  ESTADO: string;
  ALMACEN: string;
  CONDICION: string;
  PRECIO_UNITARIO: string;
  MONEDA: string;
  FECHA_OC: string;
}

export interface VentaRecord {
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

export interface InventarioItem {
  SKU: string;
  DESCRIPCION: string;
  MARCA: string;
  LINEA_PRODUCTO: string;
  ALMACEN: string;
  CANTIDAD_COMPRADA: number;
  CANTIDAD_DISPONIBLE: number;
  CANTIDAD_APARTADA: number;
  OCS: {
    NUM_OC: string;
    FECHA_OC: string;
    FECHA_EMBARQUE: string;
    FECHA_LLEGADA_BODEGA: string;
    ESTADO: string;
    OBSERVACIONES: string;
  }[];
}

export interface OverviewStats {
  totalComprado: number;
  totalDisponible: number;
  totalApartado: number;
  totalOVsPendientes: number;
  totalSKUs: number;
  totalOCs: number;
}

export interface DashboardResponse {
  compras: CompraRecord[];
  ventas: VentaRecord[];
  ovsPendientes: VentaRecord[];
  inventario: InventarioItem[];
  overview: OverviewStats;
}
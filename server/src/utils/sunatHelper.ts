import crypto from 'crypto';

interface RucInfo {
  ruc: string;
  razonSocial: string;
  estado: string;
  condicion: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

interface DniInfo {
  dni: string;
  nombreCompleto: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

// Mock Directory of Peruvian Companies (SUNAT) for instant ultra-fast response
const MOCK_SUNAT_RUC: Record<string, RucInfo> = {
  '20608974512': {
    ruc: '20608974512',
    razonSocial: 'NEXUS POS ENTERPRISE S.A.C.',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'AV. JAVIER PRADO ESTE NRO. 2450 INT. 802',
    departamento: 'LIMA',
    provincia: 'LIMA',
    distrito: 'SAN ISIDRO',
  },
  '20601234567': {
    ruc: '20601234567',
    razonSocial: 'TECH INNOVATORS DEL PERU S.A.C.',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'CALLE LAS BEGONIAS NRO. 441',
    departamento: 'LIMA',
    provincia: 'LIMA',
    distrito: 'SAN ISIDRO',
  },
  '20556677881': {
    ruc: '20556677881',
    razonSocial: 'INVERSIONES & DISTRIBUCIONES LIMA S.A.',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'AV. ALFREDO MENDIOLA NRO. 1400',
    departamento: 'LIMA',
    provincia: 'LIMA',
    distrito: 'LOS OLIVOS',
  },
  '20100047218': {
    ruc: '20100047218',
    razonSocial: 'BANCO DE CREDITO DEL PERU',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'CALLE CENTENARIO NRO. 156',
    departamento: 'LIMA',
    provincia: 'LIMA',
    distrito: 'LA MOLINA',
  },
  '20100070970': {
    ruc: '20100070970',
    razonSocial: 'SUPERMERCADOS PERUANOS S.A.',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'CALLE MORELLI NRO. 181',
    departamento: 'LIMA',
    provincia: 'LIMA',
    distrito: 'SAN BORJA',
  },
};

// Mock Directory of Citizens (RENIEC)
const MOCK_RENIEC_DNI: Record<string, DniInfo> = {
  '72819034': {
    dni: '72819034',
    nombreCompleto: 'JUAN PÉREZ DÍAZ',
    nombres: 'JUAN CARLOS',
    apellidoPaterno: 'PÉREZ',
    apellidoMaterno: 'DÍAZ',
  },
  '45892147': {
    dni: '45892147',
    nombreCompleto: 'MARÍA FLORES MAMANI',
    nombres: 'MARÍA ELENA',
    apellidoPaterno: 'FLORES',
    apellidoMaterno: 'MAMANI',
  },
  '10245896': {
    dni: '10245896',
    nombreCompleto: 'CARLOS ALBERTO MENDOZA RÍOS',
    nombres: 'CARLOS ALBERTO',
    apellidoPaterno: 'MENDOZA',
    apellidoMaterno: 'RÍOS',
  },
  '74581290': {
    dni: '74581290',
    nombreCompleto: 'SOFÍA CASTRO HUAMÁN',
    nombres: 'SOFÍA PAOLA',
    apellidoPaterno: 'CASTRO',
    apellidoMaterno: 'HUAMÁN',
  },
};

export function lookupRuc(ruc: string): RucInfo | null {
  const clean = ruc.trim();
  if (MOCK_SUNAT_RUC[clean]) {
    return MOCK_SUNAT_RUC[clean];
  }

  // If not in static mock, simulate valid enterprise generation
  if (clean.length === 11 && (clean.startsWith('10') || clean.startsWith('20'))) {
    return {
      ruc: clean,
      razonSocial: `EMPRESA COMERCIAL PERÚ ${clean.slice(-4)} S.A.C.`,
      estado: 'ACTIVO',
      condicion: 'HABIDO',
      direccion: `AV. REPUBLICA DE PANAMÁ NRO. ${clean.slice(3, 7)}, LIMA`,
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'MIRAFLORES',
    };
  }

  return null;
}

export function lookupDni(dni: string): DniInfo | null {
  const clean = dni.trim();
  if (MOCK_RENIEC_DNI[clean]) {
    return MOCK_RENIEC_DNI[clean];
  }

  if (clean.length === 8 && /^\d+$/.test(clean)) {
    return {
      dni: clean,
      nombreCompleto: `CIUDADANO REGISTRADO ${clean.slice(-3)}`,
      nombres: 'CIUDADANO',
      apellidoPaterno: 'PERUANO',
      apellidoMaterno: clean.slice(-3),
    };
  }

  return null;
}

export function generateSunatHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('base64').substring(0, 28);
}

export function buildSunatQrString(params: {
  emisorRuc: string;
  tipoDoc: string; // '01' Factura, '03' Boleta, 'NV' Nota Venta
  serie: string;
  correlativo: number;
  igv: number;
  total: number;
  fecha: string;
  tipoDocCliente: string; // '6' RUC, '1' DNI, '-' Sin doc
  numDocCliente: string;
  hash: string;
}): string {
  return [
    params.emisorRuc,
    params.tipoDoc,
    params.serie,
    String(params.correlativo).padStart(8, '0'),
    params.igv.toFixed(2),
    params.total.toFixed(2),
    params.fecha,
    params.tipoDocCliente,
    params.numDocCliente,
    params.hash,
  ].join('|');
}

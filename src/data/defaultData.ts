import { ConductorItem, PatenteItem, ProductoItem } from '../types';

export const RAW_PRODUCTOS_CSV = `PINO RADIATA;P0500RRCCAL1;5,0
PINO RADIATA;P0350URCPLLF;3.5
EUCALIPTUS GLOBULUS;E0300UGCPLVA;3,0
PINO RADIATA;P0265RRCCAL1;2.65
PINO RADIATA;P0410RRCCAL1;4.1
EUCALIPTUS NITENS;E0550UNCPLLF;5.5
EUCALIPTUS GLOBULUS;E0550UGCPLLF;5.5
PINO RADIATA;P0400NRCPLLF;4,0
EUCALIPTUS NITENS;E0350UNCPLLF;3.5
PINO RADIATA;P0265PRZCAL1;2.65
PINO RADIATA;P0244URCPLLF;2.44
EUCALIPTUS NITENS;E0600UNS15MA;6,0
PINO RADIATA;P0410RRZCAL1;4.1
EUCALIPTUS NITENS;E0600UNC15MA;6,0
PINO RADIATA;P0400URSPLLF;4,0
PINO RADIATA;P0550URZPLLF;5.5
PINO RADIATA;P0375RRCCAL1;3.75
PINO RADIATA;P0410RRSCAL1;4.1
EUCALIPTUS NITENS;E0550UNSPLLF;5.5
PINO RADIATA;P0000ARSASTI;0,0
EUCALIPTUS GLOBULUS;E0000AGSASTI;0,0
EUCALIPTUS NITENS;E0600UNC8-14;6,0
PINO RADIATA;P0400URCPLLF;4,0
EUCALIPTUS GLOBULUS;E0550UGCPLVA;5.5
PINO RADIATA;P0330RRCCAL1;3.3
PINO RADIATA;P0265RRSCAL2;2.65
PINO RADIATA;P0265MRCCAL1;2.65
PINO RADIATA;P0265PRCCAL1;2.65
PINO RADIATA;P0265PRCC1BD;2.65
EUCALIPTUS GLOBULUS;E0550UGSPLLF;5.5
EUCALIPTUS GLOBULUS;E0350UGCPLLF;3.5
PINO RADIATA;P0460RRZCAL1;4.6
PINO RADIATA;P0000ARSASTR;0,0
PINO RADIATA;P0300URCPLLF;3,0
EUCALIPTUS GLOBULUS;E0244UGCPLLF;2.44
PINO RADIATA;P0530PRCCAL1;5.3
PINO RADIATA;P0265RRSCAL1;2.65
EUCALIPTUS GLOBULUS;E0244NGCPLLF;2.44
EUCALIPTUS GLOBULUS;E0350UGSPLLF;3.5
PINO RADIATA;P0265RRSPLSD;2.65
PINO RADIATA;P0410URCPLLF;4.1
PINO RADIATA;P0265RRZCAL1;2.65
PINO RADIATA;P0300URCPLVA;3,0
EUCALIPTUS GLOBULUS;E0550UGSPART;5.5
PINO RADIATA;P0285PRCCAL1;2.85
PINO RADIATA;P0410RRZCAL3;4.1
PINO RADIATA;P0410RRCCAL3;4.1
PINO RADIATA;P0410RRCCAL2;4.1
PINO RADIATA;P0500RRCCAL2;5,0
PINO RADIATA;P0500RRCCAL3;5,0
PINO RADIATA;P0460RRCCAL1;4.6
PINO RADIATA;P0375RRCCAL3;3.75
PINO RADIATA;P0375RRCCAL2;3.75
PINO RADIATA;P0460RRZCAL3;4.6
PINO RADIATA;P0460RRZCAL2;4.6
PINO RADIATA;P0410RRZCAL2;4.1
PINO RADIATA;P0410URZPLLF;4.1
PINO RADIATA;P0410MRCCAL1;4.1`;

export function parseProductosCsv(csv: string): ProductoItem[] {
  const lines = csv.split('\n');
  const items: ProductoItem[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('Especie;') || trimmed.startsWith(';;')) continue;
    const parts = trimmed.split(';');
    if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
      items.push({
        especie: parts[0].trim(),
        codigoProducto: parts[1].trim(),
        largo: parts[2] ? parts[2].trim() : '0'
      });
    }
  }
  return items;
}

export function parseConductoresCsv(csv: string): ConductorItem[] {
  const lines = csv.split('\n');
  const items: ConductorItem[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('Rut Conductor;') || trimmed.startsWith(';;')) continue;
    const parts = trimmed.split(';');
    if (parts.length >= 3 && parts[0].trim() && parts[1].trim()) {
      items.push({
        rutConductor: parts[0].trim().toUpperCase(),
        nombreConductor: parts[1].trim().toUpperCase(),
        transportista: parts[2].trim().toUpperCase()
      });
    }
  }
  return items;
}

export function parsePatentesCsv(csv: string): PatenteItem[] {
  const lines = csv.split('\n');
  const items: PatenteItem[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('Patente Camion;') || trimmed.startsWith(';;')) continue;
    const parts = trimmed.split(';');
    if (parts.length >= 4 && parts[0].trim()) {
      items.push({
        patenteCamion: parts[0].trim().toUpperCase(),
        patenteCarro: parts[1].trim().toUpperCase(),
        siglaCamion: parts[2].trim().toUpperCase(),
        transportista: parts[3].trim().toUpperCase()
      });
    }
  }
  return items;
}

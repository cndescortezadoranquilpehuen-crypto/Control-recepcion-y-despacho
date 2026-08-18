import { ConductorItem, PatenteItem, ProductoItem, TicketItem, UserAccount } from '../types';
import { INITIAL_CONDUCTORES, INITIAL_PATENTES, INITIAL_PRODUCTOS, INITIAL_TICKETS, INITIAL_USERS } from '../data/mockSeed';
import { FirestoreService } from '../lib/firebase';
import * as XLSX from 'xlsx';

const STORAGE_KEYS = {
  PATENTES: 'portal_patentes_db',
  CONDUCTORES: 'portal_conductores_db',
  PRODUCTOS: 'portal_productos_db',
  TICKETS: 'portal_tickets_db',
  USERS: 'portal_users_db',
  AUTH: 'portal_current_user'
};

type DataListener = () => void;

export class StorageService {
  private static listeners: Set<DataListener> = new Set();

  static subscribe(listener: DataListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('Listener error:', e); }
    });
  }

  // --- INITIALIZE ALL FROM FIRESTORE ---
  static async syncWithFirestore(): Promise<void> {
    try {
      const [tickets, patentes, conductores, productos] = await Promise.all([
        FirestoreService.fetchTicketsOnce(),
        FirestoreService.fetchPatentesOnce(),
        FirestoreService.fetchConductoresOnce(),
        FirestoreService.fetchProductosOnce()
      ]);

      if (tickets.length > 0) {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      }
      if (patentes.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PATENTES, JSON.stringify(patentes));
      }
      if (conductores.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CONDUCTORES, JSON.stringify(conductores));
      }
      if (productos.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(productos));
      }
      this.notifyListeners();
    } catch (err) {
      console.warn('Sync with Firestore error:', err);
    }
  }

  // --- PATENTES ---
  static getPatentes(): PatenteItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATENTES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PATENTES, JSON.stringify(INITIAL_PATENTES));
        FirestoreService.savePatentesBatch(INITIAL_PATENTES).catch(() => {});
        return INITIAL_PATENTES;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PATENTES;
    } catch {
      return INITIAL_PATENTES;
    }
  }

  static savePatentes(items: PatenteItem[]): void {
    localStorage.setItem(STORAGE_KEYS.PATENTES, JSON.stringify(items));
    this.notifyListeners();
    FirestoreService.savePatentesBatch(items).catch(err => {
      console.warn('Could not sync patentes to Firestore:', err);
    });
  }

  // --- CONDUCTORES ---
  static getConductores(): ConductorItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONDUCTORES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CONDUCTORES, JSON.stringify(INITIAL_CONDUCTORES));
        FirestoreService.saveConductoresBatch(INITIAL_CONDUCTORES).catch(() => {});
        return INITIAL_CONDUCTORES;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CONDUCTORES;
    } catch {
      return INITIAL_CONDUCTORES;
    }
  }

  static saveConductores(items: ConductorItem[]): void {
    localStorage.setItem(STORAGE_KEYS.CONDUCTORES, JSON.stringify(items));
    this.notifyListeners();
    FirestoreService.saveConductoresBatch(items).catch(err => {
      console.warn('Could not sync conductores to Firestore:', err);
    });
  }

  // --- PRODUCTOS ---
  static getProductos(): ProductoItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTOS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(INITIAL_PRODUCTOS));
        FirestoreService.saveProductosBatch(INITIAL_PRODUCTOS).catch(() => {});
        return INITIAL_PRODUCTOS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTOS;
    } catch {
      return INITIAL_PRODUCTOS;
    }
  }

  static saveProductos(items: ProductoItem[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(items));
    this.notifyListeners();
    FirestoreService.saveProductosBatch(items).catch(err => {
      console.warn('Could not sync productos to Firestore:', err);
    });
  }

  // --- TICKETS ---
  static getTickets(): TicketItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
        INITIAL_TICKETS.forEach(t => FirestoreService.saveTicket(t).catch(() => {}));
        return INITIAL_TICKETS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  }

  static saveTicket(ticket: TicketItem): void {
    const tickets = this.getTickets();
    const existingIdx = tickets.findIndex(t => t.id === ticket.id);
    let updatedItem: TicketItem;
    if (existingIdx >= 0) {
      updatedItem = { ...ticket, updatedAt: new Date().toISOString() };
      tickets[existingIdx] = updatedItem;
    } else {
      updatedItem = { ...ticket, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      tickets.unshift(updatedItem);
    }
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    this.notifyListeners();
    FirestoreService.saveTicket(updatedItem).catch(err => {
      console.warn('Could not sync ticket to Firestore:', err);
    });
  }

  static deleteTicket(id: string): void {
    const tickets = this.getTickets().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    this.notifyListeners();
    FirestoreService.deleteTicket(id).catch(err => {
      console.warn('Could not delete ticket from Firestore:', err);
    });
  }

  // --- USERS ---
  static getUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        INITIAL_USERS.forEach(u => FirestoreService.saveUser(u).catch(() => {}));
        return INITIAL_USERS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  static saveUser(user: UserAccount): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notifyListeners();
    FirestoreService.saveUser(user).catch(err => {
      console.warn('Could not sync user to Firestore:', err);
    });
  }

  static deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notifyListeners();
  }

  // --- AUTH CURRENT USER ---
  static getCurrentUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (!data) return INITIAL_USERS[1]; // default to reception user
      return JSON.parse(data);
    } catch {
      return INITIAL_USERS[1];
    }
  }

  static setCurrentUser(user: UserAccount | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  }

  // --- EXCEL PARSER ---
  static async parseExcelFile(file: File): Promise<{
    patentes: PatenteItem[];
    conductores: ConductorItem[];
    productos: ProductoItem[];
    summary: string;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result;
          const workbook = XLSX.read(buffer, { type: 'binary' });

          let parsedPatentes: PatenteItem[] = [];
          let parsedConductores: ConductorItem[] = [];
          let parsedProductos: ProductoItem[] = [];

          // Look across all sheets in the uploaded workbook
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            const sNameLower = sheetName.toLowerCase();

            if (sNameLower.includes('patente') || sNameLower.includes('camion') || sNameLower.includes('vehiculo')) {
              parsedPatentes = this.extractPatentesFromRows(rawJson);
            } else if (sNameLower.includes('conductor') || sNameLower.includes('chofer') || sNameLower.includes('personal')) {
              parsedConductores = this.extractConductoresFromRows(rawJson);
            } else if (sNameLower.includes('producto') || sNameLower.includes('especie') || sNameLower.includes('madera')) {
              parsedProductos = this.extractProductosFromRows(rawJson);
            } else {
              if (rawJson.length > 0) {
                const header = rawJson[0].map((h: any) => String(h).toLowerCase()).join(' ');
                if (header.includes('patente')) {
                  parsedPatentes = this.extractPatentesFromRows(rawJson);
                } else if (header.includes('conductor') || header.includes('rut')) {
                  parsedConductores = this.extractConductoresFromRows(rawJson);
                } else if (header.includes('especie') || header.includes('producto')) {
                  parsedProductos = this.extractProductosFromRows(rawJson);
                }
              }
            }
          });

          // Fallback to first sheet
          if (parsedPatentes.length === 0 && parsedConductores.length === 0 && parsedProductos.length === 0 && workbook.SheetNames.length > 0) {
            const firstSheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '' }) as any[];
            parsedPatentes = this.extractPatentesFromRows(firstSheet);
          }

          resolve({
            patentes: parsedPatentes,
            conductores: parsedConductores,
            productos: parsedProductos,
            summary: `Hojas detectadas: ${workbook.SheetNames.join(', ')} | Patentes: ${parsedPatentes.length}, Conductores: ${parsedConductores.length}, Productos: ${parsedProductos.length}`
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  }

  private static extractPatentesFromRows(rows: any[][]): PatenteItem[] {
    const list: PatenteItem[] = [];
    if (rows.length < 2) return list;
    
    let colCamion = 0, colCarro = 1, colSigla = 2, colTransp = 3;
    const header = rows[0].map((c: any) => String(c).toLowerCase().trim());
    header.forEach((h: string, idx: number) => {
      if (h.includes('patente camion') || (h.includes('camion') && !h.includes('sigla'))) colCamion = idx;
      if (h.includes('patente carro') || h.includes('carro') || h.includes('remolque')) colCarro = idx;
      if (h.includes('sigla')) colSigla = idx;
      if (h.includes('transportista') || h.includes('empresa')) colTransp = idx;
    });

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[colCamion]) continue;
      const camion = String(r[colCamion]).trim().toUpperCase();
      if (!camion || camion.includes('PATENTE')) continue;
      list.push({
        patenteCamion: camion,
        patenteCarro: r[colCarro] ? String(r[colCarro]).trim().toUpperCase() : '',
        siglaCamion: r[colSigla] ? String(r[colSigla]).trim().toUpperCase() : camion,
        transportista: r[colTransp] ? String(r[colTransp]).trim().toUpperCase() : 'GENERAL'
      });
    }
    return list;
  }

  private static extractConductoresFromRows(rows: any[][]): ConductorItem[] {
    const list: ConductorItem[] = [];
    if (rows.length < 2) return list;

    let colRut = 0, colNombre = 1, colTransp = 2;
    const header = rows[0].map((c: any) => String(c).toLowerCase().trim());
    header.forEach((h: string, idx: number) => {
      if (h.includes('rut')) colRut = idx;
      if (h.includes('nombre')) colNombre = idx;
      if (h.includes('transportista') || h.includes('empresa')) colTransp = idx;
    });

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[colRut]) continue;
      const rut = String(r[colRut]).trim().toUpperCase();
      if (!rut || rut.includes('RUT')) continue;
      list.push({
        rutConductor: rut,
        nombreConductor: r[colNombre] ? String(r[colNombre]).trim().toUpperCase() : '',
        transportista: r[colTransp] ? String(r[colTransp]).trim().toUpperCase() : ''
      });
    }
    return list;
  }

  private static extractProductosFromRows(rows: any[][]): ProductoItem[] {
    const list: ProductoItem[] = [];
    if (rows.length < 2) return list;

    let colEspecie = 0, colCod = 1, colLargo = 2;
    const header = rows[0].map((c: any) => String(c).toLowerCase().trim());
    header.forEach((h: string, idx: number) => {
      if (h.includes('especie')) colEspecie = idx;
      if (h.includes('codigo') || h.includes('código') || h.includes('producto')) colCod = idx;
      if (h.includes('largo') || h.includes('longitud')) colLargo = idx;
    });

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[colEspecie]) continue;
      const esp = String(r[colEspecie]).trim().toUpperCase();
      if (!esp || esp.includes('ESPECIE')) continue;
      list.push({
        especie: esp,
        codigoProducto: r[colCod] ? String(r[colCod]).trim().toUpperCase() : '',
        largo: r[colLargo] ? String(r[colLargo]).trim() : '0'
      });
    }
    return list;
  }

  // --- EXPORT TO EXCEL ---
  static exportDatabaseExcel(): void {
    const wb = XLSX.utils.book_new();

    const wsPatentes = XLSX.utils.json_to_sheet(this.getPatentes());
    XLSX.utils.book_append_sheet(wb, wsPatentes, 'Patentes');

    const wsConductores = XLSX.utils.json_to_sheet(this.getConductores());
    XLSX.utils.book_append_sheet(wb, wsConductores, 'Conductores');

    const wsProductos = XLSX.utils.json_to_sheet(this.getProductos());
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');

    const wsTickets = XLSX.utils.json_to_sheet(this.getTickets());
    XLSX.utils.book_append_sheet(wb, wsTickets, 'Tickets_Historial');

    XLSX.writeFile(wb, `Base_datos_forestal_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}

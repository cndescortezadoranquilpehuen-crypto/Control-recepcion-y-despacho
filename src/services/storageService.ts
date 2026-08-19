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
      const [tickets, patentes, conductores, productos, users] = await Promise.all([
        FirestoreService.fetchTicketsOnce(),
        FirestoreService.fetchPatentesOnce(),
        FirestoreService.fetchConductoresOnce(),
        FirestoreService.fetchProductosOnce(),
        FirestoreService.fetchUsersOnce()
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
      if (users.length > 0) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      } else {
        // If Firestore has no users yet, seed initial users
        INITIAL_USERS.forEach(u => FirestoreService.saveUser(u).catch(() => {}));
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

  // Add single Patente with duplicate checking and uppercase enforcement
  static addPatente(item: PatenteItem): { success: boolean; isDuplicate?: boolean; message: string } {
    const patentes = this.getPatentes();
    const cleanPatente = item.patenteCamion.trim().toUpperCase();
    
    if (!cleanPatente) {
      return { success: false, message: 'La patente de camión es obligatoria.' };
    }

    const existing = patentes.find(
      p => p.patenteCamion.trim().toUpperCase() === cleanPatente
    );

    if (existing) {
      return {
        success: false,
        isDuplicate: true,
        message: `⚠️ La patente "${cleanPatente}" ya se encuentra registrada en la base de datos con el transportista "${existing.transportista}".`
      };
    }

    const formattedItem: PatenteItem = {
      patenteCamion: cleanPatente,
      siglaCamion: (item.siglaCamion || cleanPatente).trim().toUpperCase(),
      patenteCarro: (item.patenteCarro || '').trim().toUpperCase(),
      transportista: (item.transportista || 'GENERAL').trim().toUpperCase()
    };

    const updatedList = [formattedItem, ...patentes];
    localStorage.setItem(STORAGE_KEYS.PATENTES, JSON.stringify(updatedList));
    this.notifyListeners();
    FirestoreService.savePatenteSingle(formattedItem).catch(err => {
      console.warn('Error syncing single patente to Firestore:', err);
    });

    return {
      success: true,
      message: `✅ Patente "${cleanPatente}" agregada exitosamente a la base de datos.`
    };
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

  // Add single Conductor with duplicate checking and uppercase enforcement
  static addConductor(item: ConductorItem): { success: boolean; isDuplicate?: boolean; message: string } {
    const conductores = this.getConductores();
    const cleanRut = item.rutConductor.trim().toUpperCase().replace(/[\.\-\s]/g, '');
    const displayRut = item.rutConductor.trim().toUpperCase();

    if (!displayRut || !item.nombreConductor.trim()) {
      return { success: false, message: 'El RUT y Nombre del conductor son obligatorios.' };
    }

    const existing = conductores.find(
      c => c.rutConductor.trim().toUpperCase().replace(/[\.\-\s]/g, '') === cleanRut
    );

    if (existing) {
      return {
        success: false,
        isDuplicate: true,
        message: `⚠️ El conductor con RUT "${displayRut}" ya se encuentra registrado como "${existing.nombreConductor}" (${existing.transportista}).`
      };
    }

    const formattedItem: ConductorItem = {
      rutConductor: displayRut,
      nombreConductor: item.nombreConductor.trim().toUpperCase(),
      transportista: (item.transportista || 'GENERAL').trim().toUpperCase()
    };

    const updatedList = [formattedItem, ...conductores];
    localStorage.setItem(STORAGE_KEYS.CONDUCTORES, JSON.stringify(updatedList));
    this.notifyListeners();
    FirestoreService.saveConductorSingle(formattedItem).catch(err => {
      console.warn('Error syncing single conductor to Firestore:', err);
    });

    return {
      success: true,
      message: `✅ Conductor "${formattedItem.nombreConductor}" agregado exitosamente a la base de datos.`
    };
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

  // Add single Producto with duplicate checking and uppercase enforcement
  static addProducto(item: ProductoItem): { success: boolean; isDuplicate?: boolean; message: string } {
    const productos = this.getProductos();
    const cleanCodigo = item.codigoProducto.trim().toUpperCase();

    if (!cleanCodigo) {
      return { success: false, message: 'El código de producto es obligatorio.' };
    }

    const existing = productos.find(
      p => p.codigoProducto.trim().toUpperCase() === cleanCodigo
    );

    if (existing) {
      return {
        success: false,
        isDuplicate: true,
        message: `⚠️ El código de producto "${cleanCodigo}" ya existe en la base de datos (${existing.especie} - Largo ${existing.largo}m).`
      };
    }

    const formattedItem: ProductoItem = {
      especie: (item.especie || 'PINO RADIATA').trim().toUpperCase(),
      codigoProducto: cleanCodigo,
      largo: String(item.largo || '0').trim()
    };

    const updatedList = [formattedItem, ...productos];
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(updatedList));
    this.notifyListeners();
    FirestoreService.saveProductoSingle(formattedItem).catch(err => {
      console.warn('Error syncing single producto to Firestore:', err);
    });

    return {
      success: true,
      message: `✅ Producto "${cleanCodigo}" agregado exitosamente a la base de datos.`
    };
  }

  // Helper to check if a ticket is pending / awaiting closure
  static isTicketPending(ticket: TicketItem): boolean {
    if (ticket.tipo === 'despacho') {
      const missingGuia = !ticket.numeroGuia || ticket.numeroGuia.trim() === '';
      const missingPesos = !ticket.pesoTara || ticket.pesoTara.trim() === '' || !ticket.pesoNeto || ticket.pesoNeto.trim() === '';
      return missingGuia || missingPesos;
    } else {
      // Recepción: pendiente si no tiene tara/neto registrado
      const missingPesos = !ticket.pesoTara || ticket.pesoTara.trim() === '' || !ticket.pesoNeto || ticket.pesoNeto.trim() === '';
      return missingPesos;
    }
  }

  // Helper to check if a ticket is within the 48-hour temporal window
  static isWithin48Hours(ticket: TicketItem, maxHours: number = 48): boolean {
    const timeStr = ticket.createdAt || ticket.updatedAt || ticket.fechaPrograma;
    if (!timeStr) return true;
    const time = new Date(timeStr).getTime();
    if (isNaN(time)) return true;
    const diffHours = (Date.now() - time) / (1000 * 60 * 60);
    return diffHours <= maxHours;
  }

  // Calculate hours remaining in 48-hour buffer
  static getHoursRemaining(ticket: TicketItem, maxHours: number = 48): number {
    const timeStr = ticket.createdAt || ticket.updatedAt || ticket.fechaPrograma;
    if (!timeStr) return maxHours;
    const time = new Date(timeStr).getTime();
    if (isNaN(time)) return maxHours;
    const elapsedHours = (Date.now() - time) / (1000 * 60 * 60);
    const remaining = maxHours - elapsedHours;
    return remaining > 0 ? Math.round(remaining * 10) / 10 : 0;
  }

  // --- TICKETS ---
  static sortTicketsDesc(tickets: TicketItem[]): TicketItem[] {
    return [...tickets].sort((a, b) => {
      const dateTimeA = `${a.fechaPrograma || ''}T${a.hora || '00:00'}`;
      const dateTimeB = `${b.fechaPrograma || ''}T${b.hora || '00:00'}`;
      if (dateTimeA !== dateTimeB) {
        return dateTimeB.localeCompare(dateTimeA);
      }
      const timeA = a.createdAt || a.updatedAt || '';
      const timeB = b.createdAt || b.updatedAt || '';
      if (timeA !== timeB) {
        return timeB.localeCompare(timeA);
      }
      return String(b.id).localeCompare(String(a.id));
    });
  }

  static getTickets(): TicketItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
        INITIAL_TICKETS.forEach(t => FirestoreService.saveTicket(t).catch(() => {}));
        return this.sortTicketsDesc(INITIAL_TICKETS);
      }
      const parsed = JSON.parse(data);
      return this.sortTicketsDesc(Array.isArray(parsed) ? parsed : INITIAL_TICKETS);
    } catch {
      return this.sortTicketsDesc(INITIAL_TICKETS);
    }
  }

  static saveTicket(ticket: TicketItem): void {
    const tickets = this.getTickets();
    const existingIdx = tickets.findIndex(t => t.id === ticket.id);
    let updatedItem: TicketItem;
    const estado = ticket.estado || 'activo';
    if (existingIdx >= 0) {
      updatedItem = { ...ticket, estado, updatedAt: new Date().toISOString() };
      tickets[existingIdx] = updatedItem;
    } else {
      updatedItem = { ...ticket, estado, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      tickets.unshift(updatedItem);
    }
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    this.notifyListeners();
    FirestoreService.saveTicket(updatedItem).catch(err => {
      console.warn('Could not sync ticket to Firestore:', err);
    });
  }

  // Cerrar evento de Recepción/Despacho y trasladarlo al Panel General
  static closeTicket(id: string, closedByName?: string): void {
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index >= 0) {
      const updated: TicketItem = {
        ...tickets[index],
        estado: 'cerrado',
        fechaCierre: new Date().toISOString(),
        cerradoPor: closedByName || 'Usuario Actual',
        updatedAt: new Date().toISOString()
      };
      tickets[index] = updated;
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      this.notifyListeners();
      FirestoreService.saveTicket(updated).catch(err => {
        console.warn('Could not sync closed ticket to Firestore:', err);
      });
    }
  }

  // Reabrir evento cerrado de vuelta a la cola activa de Recepción/Despacho
  static reopenTicket(id: string): void {
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index >= 0) {
      const updated: TicketItem = {
        ...tickets[index],
        estado: 'activo',
        updatedAt: new Date().toISOString()
      };
      delete updated.fechaCierre;
      delete updated.cerradoPor;
      tickets[index] = updated;
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      this.notifyListeners();
      FirestoreService.saveTicket(updated).catch(err => {
        console.warn('Could not sync reopened ticket to Firestore:', err);
      });
    }
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
    FirestoreService.deleteUser(id).catch(err => {
      console.warn('Could not delete user from Firestore:', err);
    });
  }

  // --- AUTH CURRENT USER ---
  static getCurrentUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (!data) return null; // No active user session -> Login required
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: UserAccount | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
    this.notifyListeners();
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

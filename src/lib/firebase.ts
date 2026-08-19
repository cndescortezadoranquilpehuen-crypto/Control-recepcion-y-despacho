import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { TicketItem, PatenteItem, ConductorItem, ProductoItem, UserAccount } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test Firestore connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase is offline or pending initialization.');
    }
  }
}

// Helper to chunk arrays for Firestore batch writes (max 400 per batch)
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper to strip undefined values so Firestore never throws 'Unsupported field value: undefined'
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Firestore Realtime listeners and helpers
export const FirestoreService = {
  // Listen to Tickets collection
  subscribeTickets: (onUpdate: (tickets: TicketItem[]) => void) => {
    const path = 'tickets';
    try {
      return onSnapshot(
        collection(db, path),
        (snapshot) => {
          const items: TicketItem[] = [];
          snapshot.forEach((d) => {
            items.push(d.data() as TicketItem);
          });
          // Sort by createdAt descending
          items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          onUpdate(items);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, path);
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return () => {};
    }
  },

  // Fetch Tickets Once
  fetchTicketsOnce: async (): Promise<TicketItem[]> => {
    try {
      const snap = await getDocs(collection(db, 'tickets'));
      const items: TicketItem[] = [];
      snap.forEach((d) => items.push(d.data() as TicketItem));
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'tickets');
      return [];
    }
  },

  // Save / Update Ticket
  saveTicket: async (ticket: TicketItem): Promise<void> => {
    const path = `tickets/${ticket.id}`;
    try {
      const sanitized = cleanForFirestore(ticket);
      await setDoc(doc(db, 'tickets', ticket.id), sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  },

  // Delete Ticket
  deleteTicket: async (ticketId: string): Promise<void> => {
    const path = `tickets/${ticketId}`;
    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      throw err;
    }
  },

  // Listen to Patentes
  subscribePatentes: (onUpdate: (patentes: PatenteItem[]) => void) => {
    const path = 'patentes';
    try {
      return onSnapshot(
        collection(db, path),
        (snapshot) => {
          const items: PatenteItem[] = [];
          snapshot.forEach((d) => {
            items.push(d.data() as PatenteItem);
          });
          if (items.length > 0) onUpdate(items);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, path);
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return () => {};
    }
  },

  // Fetch Patentes Once
  fetchPatentesOnce: async (): Promise<PatenteItem[]> => {
    try {
      const snap = await getDocs(collection(db, 'patentes'));
      const items: PatenteItem[] = [];
      snap.forEach((d) => items.push(d.data() as PatenteItem));
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'patentes');
      return [];
    }
  },

  // Bulk save patentes with chunking (up to 400 per batch)
  savePatentesBatch: async (patentes: PatenteItem[]): Promise<void> => {
    const chunks = chunkArray(patentes, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((p, idx) => {
        const cleanDocId = p.patenteCamion.trim().toUpperCase().replace(/[^a-zA-Z0-9_-]/g, '_') || `pat_${Date.now()}_${idx}`;
        batch.set(doc(db, 'patentes', cleanDocId), {
          patenteCamion: p.patenteCamion.trim().toUpperCase(),
          patenteCarro: (p.patenteCarro || '').trim().toUpperCase(),
          siglaCamion: (p.siglaCamion || p.patenteCamion).trim().toUpperCase(),
          transportista: (p.transportista || 'GENERAL').trim().toUpperCase()
        });
      });
      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'patentes');
        throw err;
      }
    }
  },

  // Listen to Conductores
  subscribeConductores: (onUpdate: (conductores: ConductorItem[]) => void) => {
    const path = 'conductores';
    try {
      return onSnapshot(
        collection(db, path),
        (snapshot) => {
          const items: ConductorItem[] = [];
          snapshot.forEach((d) => {
            items.push(d.data() as ConductorItem);
          });
          if (items.length > 0) onUpdate(items);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, path);
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return () => {};
    }
  },

  // Fetch Conductores Once
  fetchConductoresOnce: async (): Promise<ConductorItem[]> => {
    try {
      const snap = await getDocs(collection(db, 'conductores'));
      const items: ConductorItem[] = [];
      snap.forEach((d) => items.push(d.data() as ConductorItem));
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'conductores');
      return [];
    }
  },

  // Bulk save conductores with chunking
  saveConductoresBatch: async (conductores: ConductorItem[]): Promise<void> => {
    const chunks = chunkArray(conductores, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((c, idx) => {
        const cleanDocId = c.rutConductor.trim().toUpperCase().replace(/[^a-zA-Z0-9_-]/g, '_') || `cond_${Date.now()}_${idx}`;
        batch.set(doc(db, 'conductores', cleanDocId), {
          rutConductor: c.rutConductor.trim().toUpperCase(),
          nombreConductor: (c.nombreConductor || '').trim().toUpperCase(),
          transportista: (c.transportista || 'GENERAL').trim().toUpperCase()
        });
      });
      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'conductores');
        throw err;
      }
    }
  },

  // Listen to Productos
  subscribeProductos: (onUpdate: (productos: ProductoItem[]) => void) => {
    const path = 'productos';
    try {
      return onSnapshot(
        collection(db, path),
        (snapshot) => {
          const items: ProductoItem[] = [];
          snapshot.forEach((d) => {
            items.push(d.data() as ProductoItem);
          });
          if (items.length > 0) onUpdate(items);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, path);
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return () => {};
    }
  },

  // Fetch Productos Once
  fetchProductosOnce: async (): Promise<ProductoItem[]> => {
    try {
      const snap = await getDocs(collection(db, 'productos'));
      const items: ProductoItem[] = [];
      snap.forEach((d) => items.push(d.data() as ProductoItem));
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'productos');
      return [];
    }
  },

  // Bulk save productos with chunking
  saveProductosBatch: async (productos: ProductoItem[]): Promise<void> => {
    const chunks = chunkArray(productos, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((p, idx) => {
        const cleanDocId = p.codigoProducto.trim().toUpperCase().replace(/[^a-zA-Z0-9_-]/g, '_') || `prod_${Date.now()}_${idx}`;
        batch.set(doc(db, 'productos', cleanDocId), {
          especie: (p.especie || 'PINO RADIATA').trim().toUpperCase(),
          codigoProducto: p.codigoProducto.trim().toUpperCase(),
          largo: String(p.largo || '0').trim()
        });
      });
      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'productos');
        throw err;
      }
    }
  },

  // Save single patente
  savePatenteSingle: async (p: PatenteItem): Promise<void> => {
    const cleanDocId = p.patenteCamion.trim().toUpperCase().replace(/[^a-zA-Z0-9_-]/g, '_') || `pat_${Date.now()}`;
    const path = `patentes/${cleanDocId}`;
    try {
      await setDoc(doc(db, 'patentes', cleanDocId), {
        patenteCamion: p.patenteCamion.trim().toUpperCase(),
        patenteCarro: (p.patenteCarro || '').trim().toUpperCase(),
        siglaCamion: (p.siglaCamion || p.patenteCamion).trim().toUpperCase(),
        transportista: (p.transportista || 'GENERAL').trim().toUpperCase()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  },

  // Save single conductor
  saveConductorSingle: async (c: ConductorItem): Promise<void> => {
    const cleanDocId = c.rutConductor.trim().toUpperCase().replace(/[^a-zA-Z0-9_-]/g, '_') || `cond_${Date.now()}`;
    const path = `conductores/${cleanDocId}`;
    try {
      await setDoc(doc(db, 'conductores', cleanDocId), {
        rutConductor: c.rutConductor.trim().toUpperCase(),
        nombreConductor: (c.nombreConductor || '').trim().toUpperCase(),
        transportista: (c.transportista || 'GENERAL').trim().toUpperCase()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  },

  // Save single producto
  saveProductoSingle: async (p: ProductoItem): Promise<void> => {
    const cleanDocId = p.codigoProducto.trim().toUpperCase().replace(/[^a-zA-Z0-9_-]/g, '_') || `prod_${Date.now()}`;
    const path = `productos/${cleanDocId}`;
    try {
      await setDoc(doc(db, 'productos', cleanDocId), {
        especie: (p.especie || 'PINO RADIATA').trim().toUpperCase(),
        codigoProducto: p.codigoProducto.trim().toUpperCase(),
        largo: String(p.largo || '0').trim()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  },

  // Purge tickets older than 48 hours from Firestore temporal database
  purgeExpiredTickets: async (maxAgeHours: number = 48): Promise<number> => {
    try {
      const snap = await getDocs(collection(db, 'tickets'));
      const now = Date.now();
      const cutoffTime = now - (maxAgeHours * 60 * 60 * 1000);
      let purgedCount = 0;
      const batch = writeBatch(db);

      snap.forEach((d) => {
        const data = d.data() as TicketItem;
        const createdAtTime = new Date(data.createdAt || data.fechaPrograma).getTime();
        // If older than 48 hours AND not pending (or unconditionally older than 48 hours)
        if (!isNaN(createdAtTime) && createdAtTime < cutoffTime) {
          batch.delete(d.ref);
          purgedCount++;
        }
      });

      if (purgedCount > 0) {
        await batch.commit();
      }
      return purgedCount;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'tickets');
      return 0;
    }
  },

  // Listen to Users
  subscribeUsers: (onUpdate: (users: UserAccount[]) => void) => {
    const path = 'users';
    try {
      return onSnapshot(
        collection(db, path),
        (snapshot) => {
          const items: UserAccount[] = [];
          snapshot.forEach((d) => {
            items.push(d.data() as UserAccount);
          });
          if (items.length > 0) onUpdate(items);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, path);
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return () => {};
    }
  },

  // Fetch Users Once
  fetchUsersOnce: async (): Promise<UserAccount[]> => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const items: UserAccount[] = [];
      snap.forEach((d) => items.push(d.data() as UserAccount));
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
      return [];
    }
  },

  // Save User
  saveUser: async (user: UserAccount): Promise<void> => {
    const path = `users/${user.id}`;
    try {
      const sanitized = cleanForFirestore(user);
      await setDoc(doc(db, 'users', user.id), sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  },

  // Delete User
  deleteUser: async (userId: string): Promise<void> => {
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      throw err;
    }
  }
};

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

  // Save / Update Ticket
  saveTicket: async (ticket: TicketItem): Promise<void> => {
    const path = `tickets/${ticket.id}`;
    try {
      await setDoc(doc(db, 'tickets', ticket.id), ticket);
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

  // Bulk save patentes
  savePatentesBatch: async (patentes: PatenteItem[]): Promise<void> => {
    const batch = writeBatch(db);
    patentes.forEach((p, idx) => {
      const docId = p.patenteCamion.replace(/[^a-zA-Z0-9_-]/g, '') || `pat-${idx}`;
      batch.set(doc(db, 'patentes', docId), p);
    });
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'patentes');
      throw err;
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

  // Bulk save conductores
  saveConductoresBatch: async (conductores: ConductorItem[]): Promise<void> => {
    const batch = writeBatch(db);
    conductores.forEach((c, idx) => {
      const docId = c.rutConductor.replace(/[^a-zA-Z0-9_-]/g, '') || `cond-${idx}`;
      batch.set(doc(db, 'conductores', docId), c);
    });
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'conductores');
      throw err;
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

  // Bulk save productos
  saveProductosBatch: async (productos: ProductoItem[]): Promise<void> => {
    const batch = writeBatch(db);
    productos.forEach((p, idx) => {
      const docId = p.codigoProducto.replace(/[^a-zA-Z0-9_-]/g, '') || `prod-${idx}`;
      batch.set(doc(db, 'productos', docId), p);
    });
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'productos');
      throw err;
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

  // Save User
  saveUser: async (user: UserAccount): Promise<void> => {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  }
};

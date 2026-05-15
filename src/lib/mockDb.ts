import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db as firestore, auth } from './firebase';
import { firestoreService } from './firestoreService';

export type Role = 'admin' | 'nasabah';

export interface User {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  password?: string;
  role: Role;
  balance: number;
  joinDate: string;
  isActive: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceName: string;
  browser: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface HargaSampah {
  id: string;
  code: string;
  name: string;
  category: string;
  pricePerKg: number;
  lastUpdate: string;
}

export interface Setoran {
  id: string;
  userId: string;
  sampahId: string;
  weight: number;
  pricePerKg: number;
  subtotal: number;
  date: string;
}

export interface Penarikan {
  id: string;
  userId: string;
  amount: number;
  method: string;
  notes: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Penjualan {
  id: string;
  pengepulName: string;
  sampahId: string;
  weight: number;
  pricePerKg: number;
  total: number;
  date: string;
}

// Bridging MockDB interface to Firebase
class FirebaseDB {
  async getUsers(): Promise<User[]> {
    return firestoreService.getCollection<User>('users');
  }

  async getHargaSampah(): Promise<HargaSampah[]> {
    return firestoreService.getCollection<HargaSampah>('hargaSampah');
  }

  async getSetoran(userId?: string): Promise<Setoran[]> {
    const constraints: any[] = [];
    if (userId) {
      const { where } = await import('firebase/firestore');
      constraints.push(where('userId', '==', userId));
    }
    return firestoreService.getCollection<Setoran>('setoran', ...constraints);
  }

  async getPenarikan(userId?: string): Promise<Penarikan[]> {
    const constraints: any[] = [];
    if (userId) {
      const { where } = await import('firebase/firestore');
      constraints.push(where('userId', '==', userId));
    }
    return firestoreService.getCollection<Penarikan>('penarikan', ...constraints);
  }

  async getPenjualan(): Promise<Penjualan[]> {
    return firestoreService.getCollection<Penjualan>('penjualan');
  }

  // Set methods need to handle individual updates or collection writes
  async updateUser(id: string, data: Partial<User>) {
    await firestoreService.updateDocument('users', id, data);
  }

  async addSetoran(data: Omit<Setoran, 'id'>) {
    const docRef = await addDoc(collection(firestore, 'setoran'), {
      ...data,
      date: new Date().toISOString()
    });
    return docRef.id;
  }

  async updateHargaSampah(id: string, data: Partial<HargaSampah>) {
    await firestoreService.updateDocument('hargaSampah', id, {
      ...data,
      lastUpdate: new Date().toISOString()
    });
  }

  async deleteUser(id: string) {
    await firestoreService.deleteDocument('users', id);
  }

  // Legacy stubs for compatibility (to be cleaned up)
  getCurrentUser() { return null; } // Use useAuth() instead
  setCurrentUser(_user: any) {}
  isLocked(_email: string) { return false; }
  recordLoginAttempt(_email: string, _success: boolean) {}
  getLoginAttempts(_email: string) { return { count: 0, lastAttempt: 0 }; }
  recordSession(_userId: string) {}
  getSessions() { return []; }
}

export const db = new FirebaseDB();

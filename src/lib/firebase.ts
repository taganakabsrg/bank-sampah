import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// Using experimentalForceLongPolling to avoid WebSocket issues in some restricted environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Simple lazy check instead of aggressive top-level test
let connectionTested = false;
export async function checkConnection() {
  if (connectionTested) return;
  try {
    // Just a quick ping
    await getDocFromServer(doc(db, 'test', 'ping'));
    connectionTested = true;
  } catch (error) {
    console.warn("Firestore connection check - might be offline or still initializing:", error);
  }
}

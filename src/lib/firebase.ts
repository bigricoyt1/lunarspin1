import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc as fDoc, onSnapshot as fOnSnapshot, 
  updateDoc as fUpdateDoc, increment as fIncrement, 
  getDoc as fGetDoc, getDocFromServer as fGetDocFromServer, collection as fCollection, 
  query as fQuery, getDocs as fGetDocs, setDoc as fSetDoc, 
  addDoc as fAddDoc, deleteDoc as fDeleteDoc,
  orderBy as fOrderBy, limit as fLimit, 
  serverTimestamp as fServerTimestamp, where as fWhere, 
  runTransaction as fRunTransaction, arrayUnion as fArrayUnion, 
  arrayRemove as fArrayRemove
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged as fOnAuthStateChanged, signOut as fSignOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Re-export standard Firebase functions
export const doc = fDoc;
export const onSnapshot = fOnSnapshot;
export const updateDoc = fUpdateDoc;
export const increment = fIncrement;
export const getDoc = fGetDoc;
export const getDocFromServer = fGetDocFromServer;
export const collection = fCollection;
export const query = fQuery;
export const getDocs = fGetDocs;
export const setDoc = fSetDoc;
export const addDoc = fAddDoc;
export const deleteDoc = fDeleteDoc;
export const orderBy = fOrderBy;
export const limit = fLimit;
export const serverTimestamp = fServerTimestamp;
export const where = fWhere;
export const runTransaction = fRunTransaction;
export const arrayUnion = fArrayUnion;
export const arrayRemove = fArrayRemove;
export const onAuthStateChanged = fOnAuthStateChanged;
export const signOut = fSignOut;

export function handleFirestoreError(error: any, operation: any, path: any) {
  console.error(`Firebase error [${operation}] on ${path}:`, error);
}

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

// Placeholder for Google provider if still used
export const googleProvider = { type: 'google' };
export const signInWithGoogle = () => {
    // This requires proper setup. For now, simple console log as a placeholder is dangerous but required to bridge the gap.
    console.log('Use real Firebase OAuth provider instantiation');
};

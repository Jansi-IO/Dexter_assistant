import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  addDoc,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore targeting the specific database ID
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline:', error.message);
      return false;
    }
    // Document not found is fine, connection succeeded
    return true;
  }
}

// Auth Helpers with concurrent guard and iframe popup resilience
let isSigningIn = false;

export async function signInWithGoogle(): Promise<User | null> {
  if (isSigningIn) {
    return null;
  }
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Sync user profile in Firestore
      await setDoc(
        doc(db, 'users', result.user.uid),
        {
          uid: result.user.uid,
          displayName: result.user.displayName || 'Dexter User',
          email: result.user.email || '',
          photoURL: result.user.photoURL || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return result.user;
    }
    return null;
  } catch (err: any) {
    const code = err?.code || '';
    // Gracefully handle standard browser/user popup actions without unhandled exceptions
    if (
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/popup-closed-by-user'
    ) {
      // User closed the popup or clicked outside — benign user cancellation
      return null;
    }

    if (code === 'auth/popup-blocked') {
      console.warn('Google Sign-In popup was blocked by your browser. Please allow popups for this site or open in a new tab.');
      return null;
    }

    console.warn('Google Sign-In notification:', err?.message || err);
    return null;
  } finally {
    isSigningIn = false;
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// User Profile sync
export async function updateUserPreferences(
  userId: string,
  prefs: { osType?: string; voiceMuted?: boolean; voiceName?: string }
): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    {
      ...prefs,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// Routine Persistence
export async function saveRoutineToFirestore(userId: string, routine: any): Promise<void> {
  await setDoc(
    doc(db, 'users', userId, 'routines', routine.id),
    {
      id: routine.id,
      userId,
      name: routine.name,
      description: routine.description || '',
      triggerVoicePhrases: routine.triggerVoicePhrases.join(','),
      category: routine.category || 'productivity',
      stepsJson: JSON.stringify(routine.steps),
      active: routine.active ?? true,
      runCount: routine.runCount || 0,
      updatedAt: new Date().toISOString(),
      createdAt: routine.createdAt || new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function deleteRoutineFromFirestore(userId: string, routineId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'routines', routineId));
}

// Script Persistence
export async function saveScriptToFirestore(userId: string, script: any): Promise<void> {
  await setDoc(
    doc(db, 'users', userId, 'scripts', script.id),
    {
      id: script.id,
      userId,
      title: script.title,
      description: script.description || '',
      language: script.language,
      code: script.code,
      dependencies: Array.isArray(script.dependencies) ? script.dependencies.join(', ') : (script.dependencies || ''),
      safetyNotes: script.safetyNotes || '',
      updatedAt: new Date().toISOString(),
      createdAt: script.createdAt || new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function deleteScriptFromFirestore(userId: string, scriptId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'scripts', scriptId));
}

// Execution Log Persistence
export async function saveLogToFirestore(userId: string, logEntry: any): Promise<void> {
  await setDoc(
    doc(db, 'users', userId, 'logs', logEntry.id),
    {
      id: logEntry.id,
      userId,
      timestamp: logEntry.timestamp,
      command: logEntry.command,
      origin: logEntry.origin || 'text',
      intent: logEntry.intent || 'GENERAL',
      status: logEntry.status || 'success',
      spokenResponse: logEntry.spokenResponse || '',
      outputDetails: logEntry.outputDetails || '',
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// Media Record Persistence
export async function saveMediaRecordToFirestore(
  userId: string,
  record: { type: string; title: string; content: string; metadata?: any }
): Promise<string> {
  const id = `media-${Date.now()}`;
  await setDoc(doc(db, 'users', userId, 'media', id), {
    id,
    userId,
    type: record.type,
    title: record.title,
    content: record.content,
    metadataJson: JSON.stringify(record.metadata || {}),
    createdAt: new Date().toISOString(),
  });
  return id;
}

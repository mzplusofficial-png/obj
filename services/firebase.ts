import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  getDocFromServer,
  doc,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;

// // Test connection CRITICAL
// async function testConnection() {
//   try {
//     await getDocFromServer(doc(db, 'test', 'connection'));
//   } catch (error) {
//     if(error instanceof Error && error.message.includes('the client is offline')) {
//       console.error("Please check your Firebase configuration.");
//     }
//   }
// }
// testConnection();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function addLivePulseEvent(event: {
  user_name: string;
  type: "gain" | "join" | "premium" | "coaching";
  detail: string;
}) {
  try {
    await addDoc(collection(db, "live_pulse"), {
      ...event,
      created_at: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "live_pulse");
  }
}

export const requestNotificationPermission = async (vapidKey: string) => {
  if (!messaging) {
    console.error("FCM: Messaging not supported or initialized");
    return { token: null, status: "unsupported" };
  }

  try {
    if (!("Notification" in window)) {
      console.error("FCM: Notifications not supported by browser");
      return { token: null, status: "unsupported" };
    }

    let registration;
    if ("serviceWorker" in navigator) {
      try {
        // ✅ CORRECTION : Réutiliser le Service Worker existant au lieu de le réenregistrer
        // Cela évite la race condition et les conflits d'enregistrement
        const existingRegistration = await navigator.serviceWorker.getRegistration('/');
        if (existingRegistration) {
          console.log("FCM: Reusing existing Service Worker:", existingRegistration.scope);
          registration = existingRegistration;
        } else {
          // Si aucun SW n'existe, en enregistrer un nouveau
          console.log("FCM: No existing Service Worker found, registering new one");
          registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js?v=MZ4",
            { scope: "/" },
          );
          console.log("FCM: Service Worker registered:", registration.scope);
        }
      } catch (swError) {
        console.error("FCM: Service Worker registration failed:", swError);
      }
    }

    // ✅ CORRECTION : Attendre que le Service Worker soit activé avant de demander la permission
    if (registration && registration.active) {
      console.log("FCM: Service Worker is active, proceeding with permission request");
    } else if (registration) {
      console.log("FCM: Waiting for Service Worker activation...");
      // Attendre l'activation du Service Worker
      await new Promise<void>((resolve) => {
        if (registration.active) {
          resolve();
        } else {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log("FCM: Service Worker activated");
                  resolve();
                }
              });
            }
          });
        }
      });
    }

    // alert('Demande de permission en cours...');
    const permission = await Notification.requestPermission();
    // alert('Résultat permission: ' + permission);
    console.log("FCM: Permission result:", permission);

    if (permission === "granted") {
      try {
        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration,
        });
        if (!token) {
          console.error("FCM: Token generation failed - no token returned");
          return { token: null, status: "error" };
        }
        console.log("FCM: Token generated successfully:", token.substring(0, 20) + "...");
        return { token, status: "granted" };
      } catch (tokenError) {
        console.error("FCM: Error generating token:", tokenError);
        return { token: null, status: "error" };
      }
    } else {
      console.warn("FCM: Permission not granted. Status:", permission);
      return { token: null, status: permission };
    }
  } catch (error) {
    console.error("FCM: Error in requestNotificationPermission:", error);
    return { token: null, status: "error" };
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return;
  return onMessage(messaging, (payload) => {
    console.log("FCM: Foreground message received:", payload);
    callback(payload);
  });
};

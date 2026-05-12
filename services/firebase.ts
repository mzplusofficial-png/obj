import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
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

// Messaging initialization needs to be async for isSupported check
export let messaging: any = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
      console.log("FCM: Messaging is supported and initialized");
    } else {
      console.warn("FCM: Messaging is not supported in this browser environment");
    }
  }).catch(err => {
    console.error("FCM: Error checking for messaging support:", err);
  });
}

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
  console.log("FCM: Starting requestNotificationPermission with vapidKey:", vapidKey);
  
  if (typeof window === "undefined") return { token: null, status: "unsupported" };

  try {
    const supported = await isSupported();
    if (!supported) {
      console.error("FCM: Notifications not supported by this browser");
      return { token: null, status: "unsupported" };
    }

    const messagingInst = getMessaging(app);
    console.log("FCM: Current Notification.permission:", Notification.permission);

    // Explicitly request permission FIRST (better for user gesture detection)
    console.log("FCM: Triggering Notification.requestPermission()...");
    const permission = await Notification.requestPermission();
    console.log("FCM: Decision:", permission);

    if (permission !== "granted") {
      return { token: null, status: permission };
    }

    console.log("FCM: Permission GRANTED. Ensuring Service Worker is ready...");

    // Then ensure service worker is registered properly
    let registration;
    if ("serviceWorker" in navigator) {
      try {
        console.log("FCM: Registering service worker...");
        registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          scope: "/",
        });
        await navigator.serviceWorker.ready;
        console.log("FCM: Service Worker active");
      } catch (swErr) {
        console.error("FCM: SW registration error:", swErr);
      }
    }

    console.log("FCM: Getting token...");
    const token = await getToken(messagingInst, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration,
    });
      
      if (token) {
        console.log("FCM: Token acquired:", token);
        return { token, status: "granted" };
      } else {
        console.warn("FCM: Token is null");
        return { token: null, status: "no_token" };
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

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestNotificationPermission = async (vapidKey: string) => {
  if (!messaging) {
    console.error('FCM: Messaging not supported or initialized');
    return { token: null, status: 'unsupported' };
  }

  try {
    if (!('Notification' in window)) {
      console.error('FCM: Notifications not supported by browser');
      return { token: null, status: 'unsupported' };
    }

    let registration;
    if ('serviceWorker' in navigator) {
      try {
        // Ajout d'un paramètre de version pour forcer la mise à jour sur mobile
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js?v=MZ4', { scope: '/' });
        console.log('FCM: Service Worker registered:', registration.scope);
      } catch (swError) {
        console.error('FCM: Service Worker registration failed:', swError);
      }
    }

    // alert('Demande de permission en cours...');
    const permission = await Notification.requestPermission();
    // alert('Résultat permission: ' + permission);
    console.log('FCM: Permission result:', permission);

    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });
      return { token, status: 'granted' };
    } else {
      return { token: null, status: permission };
    }
  } catch (error) {
    console.error('FCM: Error in requestNotificationPermission:', error);
    return { token: null, status: 'error' };
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return;
  return onMessage(messaging, (payload) => {
    console.log('FCM: Foreground message received:', payload);
    callback(payload);
  });
};

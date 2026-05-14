import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';

const initAdmin = () => {
  if (admin.apps.length) return admin;

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saJson) {
    console.error('FCM: FIREBASE_SERVICE_ACCOUNT is missing from environment variables!');
    return admin;
  }

  try {
    // Nettoyer les éventuels problèmes de formatage du JSON (retours à la ligne, etc.)
    const cleanedJson = saJson.trim();
    const serviceAccount = JSON.parse(cleanedJson);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('FCM: Firebase Admin initialized successfully');
  } catch (e: any) {
    console.error('FCM: Error parsing FIREBASE_SERVICE_ACCOUNT:', e.message);
  }
  return admin;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { token, tokens, title, body, url, icon } = JSON.parse(event.body || '{}');

  try {
    const adminInstance = initAdmin();
    if (!adminInstance.apps.length) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Firebase not initialized' }) };
    }

    const payloadBase = {
      notification: { title, body },
      data: { title, body, url: url || '/', icon: icon || '/icon.png' },
      webpush: {
        notification: {
          title,
          body,
          icon: icon || '/icon.png',
          click_action: url || '/'
        }
      }
    };

    if (tokens && Array.isArray(tokens) && tokens.length > 0) {
      const response = await adminInstance.messaging().sendEach(tokens.map(t => ({ ...payloadBase, token: t })));
      return { 
        statusCode: 200, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, ...response }) 
      };
    } else if (token) {
      const response = await adminInstance.messaging().send({ ...payloadBase, token });
      return { 
        statusCode: 200, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, messageId: response }) 
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Token missing' }) };
  } catch (error: any) {
    console.error('FCM Error:', error);
    return { 
      statusCode: 500, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message }) 
    };
  }
};

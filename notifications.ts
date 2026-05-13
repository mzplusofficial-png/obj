import admin from 'firebase-admin';

/**
 * Service de Notifications Push (Firebase Admin SDK HTTP v1)
 * Ce module est conçu pour être importé et utilisé n'importe où dans le backend.
 */

/**
 * Initialise l'instance Admin (à appeler au démarrage du serveur)
 */
export const initAdmin = () => {
    if (admin.apps.length) return admin;

    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (saJson) {
        try {
            const serviceAccount = JSON.parse(saJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin initialisé via variable d\'environnement');
        } catch (e) {
            console.error('Erreur lors du parsing de FIREBASE_SERVICE_ACCOUNT:', e);
        }
    } else {
        console.warn('Attention: FIREBASE_SERVICE_ACCOUNT non configuré.');
    }
    return admin;
};

/**
 * Envoie une notification de manière sécurisée et gère les erreurs de tokens.
 * 
 * @param token Token FCM du destinataire
 * @param title Titre de la notification
 * @param body Corps du message
 * @param options Données supplémentaires (icon, url, data)
 */
export const sendPush = async (
    token: string, 
    title: string, 
    body: string, 
    options: { icon?: string; url?: string; data?: any } = {}
) => {
    // S'assurer qu'admin est prêt
    if (!admin.apps.length) initAdmin();

    const payload = {
        token,
        notification: {
            title,
            body,
        },
        // Données transmises au Service Worker en arrière-plan
        data: {
            ...(options.data as Record<string, string> || {}),
            title,
            body,
            url: options.url || '/',
            icon: options.icon || '/icon.png'
        },
        // Configuration spécifique Web Push (Arrière-plan et compatibilité navigateurs)
        webpush: {
            headers: {
                Urgency: 'high'
            },
            notification: {
                title,
                body,
                icon: options.icon || '/icon.png',
                badge: options.icon || '/icon.png',
                click_action: options.url || '/',
                requireInteraction: true // La notification reste jusqu'à interaction
            },
            fcmOptions: {
                link: options.url || '/'
            }
        }
    };

    try {
        const response = await admin.messaging().send(payload);
        return { success: true, messageId: response };
    } catch (error: unknown) {
        // Detection des tokens expirés ou invalides
        const err = error as { code?: string; message?: string };
        const isInvalid = 
            err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token';

        if (isInvalid) {
            return { success: false, error: 'invalid_token', reason: err.message };
        }

        console.error('Erreur FCM:', error);
        return { success: false, error: 'unknown_error', reason: err.message };
    }
};

/**
 * Cas d'usage spécifique : Ajout de produit
 */
export const notifyProductAdded = async (token: string, productName: string) => {
    return sendPush(
        token,
        'Produit ajouté ! 🚀',
        `Le produit "${productName}" est maintenant disponible dans votre boutique.`,
        {
            url: '/boutique',
            icon: '/icon.png' // Assurez-vous que cette icône existe
        }
    );
};

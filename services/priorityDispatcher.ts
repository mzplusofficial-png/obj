import { createClient } from '@supabase/supabase-js';
import { sendPush } from '../notifications.js';

const RAW_URL = process.env.VITE_SUPABASE_URL || 'https://ydkicdhcylpdffuzgdvm.supabase.co';
const SUPABASE_URL = RAW_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for backend bypass

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');

export async function runPriorityDispatcher() {
    console.log('[Dispatcher] Checking for pending background notifications...');
    
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;
    const SUPABASE_URL_ENV = process.env.VITE_SUPABASE_URL;
    
    if (!SUPABASE_SERVICE_ROLE && !SUPABASE_ANON) {
        console.error('[Dispatcher] CRITICAL: No Supabase keys found in environment variables. Check SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_ANON_KEY.');
        return;
    }

    if (!SUPABASE_URL_ENV) {
        console.error('[Dispatcher] CRITICAL: VITE_SUPABASE_URL is missing.');
        return;
    }

    try {
        // 1. Fetch users with active challenges
        const fetchChallenges = async () => {
            try {
                const { data, error } = await supabase
                    .from('mz_challenge_3j_state')
                    .select('user_id')
                    .eq('presented', true)
                    .eq('cancelled', false)
                    .eq('j3_completed', false);

                if (error) {
                    if (error.code === '42P01') {
                        console.warn('[Dispatcher] Table mz_challenge_3j_state not found. Skipping challenge-based notifications.');
                        return { data: [], error: null };
                    }
                    return { data: null, error };
                }
                return { data, error: null };
            } catch (e) {
                console.error('[Dispatcher] Unexpected error querying mz_challenge_3j_state:', e);
                return { data: [], error: null };
            }
        };

        const { data: challengeUsers, error: challengeError } = await fetchChallenges();
        if (challengeError) {
            console.error('[Dispatcher] challengeError:', JSON.stringify(challengeError));
            return;
        }

        const challengeIds = challengeUsers?.map(c => c.user_id) || [];
        if (challengeIds.length === 0) {
            console.log('[Dispatcher] No users with active challenges found.');
            return;
        }

        // 2. Fetch activity tracking for ALL candidates
        const today = new Date().toISOString().split('T')[0];
        const { data: activeTracking, error: trackingError } = await supabase
            .from('mz_rewards_time_tracking')
            .select('user_id, last_ping')
            .eq('tracking_date', today)
            .in('user_id', challengeIds);

        if (trackingError && trackingError.code !== '42P01') {
            console.error('[Dispatcher] trackingError fetching activity:', trackingError);
            return;
        }

        // 3. Fetch user data
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, fcm_token, full_name')
            .in('id', challengeIds);

        if (usersError) {
            console.error('[Dispatcher] usersError:', usersError);
            throw usersError;
        }

        console.log(`[Dispatcher] Found ${usersData?.length || 0} candidates with active challenges. Evaluating triggers...`);

        for (const userData of (usersData || [])) {
            const userId = userData.id;
            try {
                if (!userData.fcm_token) continue;
                
                // Get last ping for this user
                const userPing = activeTracking?.find(t => t.user_id === userId);
                const lastActivityDate = userPing?.last_ping ? new Date(userPing.last_ping) : new Date(0);
                const secondsSinceLastActivity = (Date.now() - lastActivityDate.getTime()) / 1000;

                const { data: challenge, error: stateError } = await supabase
                    .from('mz_challenge_3j_state')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (stateError || !challenge) continue;

                const hasActiveChallenge = !challenge.cancelled && !challenge.j3_completed;
                if (!hasActiveChallenge) continue;

                let notifType: string | null = null;
                let title = '';
                let body = '';
                let url = '/';
                let inactivityNeeded = 60; // Default 60s

                const startedAtDate = challenge.started_at ? new Date(challenge.started_at).toISOString().split('T')[0] : null;
                const isNextDayPlus = startedAtDate && startedAtDate < today;

                const dateObj = new Date();
                const dayBeforeYesterday = new Date(dateObj);
                dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
                const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split('T')[0];
                const isDay3Strict = startedAtDate && startedAtDate <= dayBeforeYesterdayStr;

                const j2CompAt = challenge.j2_completed_at ? new Date(challenge.j2_completed_at).toISOString().split('T')[0] : null;
                const isDay3TimeAfterJ2 = j2CompAt && j2CompAt < today;

                // CAS : Jour 3 mais Jour 2 non complété (Upsell Premium après 5 min)
                if (isDay3Strict && !challenge.j2_completed) {
                    notifType = 'challenge_j2_late_j3_upsell';
                    title = "👋 Hey, c’est Axis.";
                    body = "🔥 Je vois que tu n’as pas encore généré tes premiers revenus. 👑 Beaucoup de membres Premium l’ont déjà fait. 🚀 Il est peut-être temps de passer au niveau supérieur.";
                    url = '/dashboard?tab=flash_offer';
                    inactivityNeeded = 300; // 5 MINUTES (300 secondes) pour ce cas précis
                }
                // Message du Jour 3 (Si J2 complété hier ou avant)
                else if (isDay3TimeAfterJ2 && !challenge.j3_presented && !challenge.j3_completed) {
                     notifType = 'challenge_j3_start';
                     title = "👑 Le grand final, c'est aujourd'hui !";
                     body = "C'est ton Jour 3. Tu es à deux doigts de l'apothéose. Finis ce que tu as commencé en beauté, je t'attends.";
                     url = '/dashboard';
                }
                // Rappel Jour 2 (Si commencé mais pas fini)
                else if (challenge.j2_started_at && !challenge.j2_completed) {
                    notifType = 'challenge_j2_reminder';
                    title = "✨ Ne t'arrête pas en si bon chemin...";
                    body = "Tu as déjà commencé le Jour 2, c'est le plus gros du travail ! Reprends ton élan, tu vas y arriver.";
                    url = '/dashboard';
                }
                // Message du Jour 2 (Automatique le lendemain, si pas encore commencé)
                else if (isNextDayPlus && !challenge.j2_started_at && !challenge.j2_completed && !challenge.j3_presented) {
                    notifType = 'challenge_j2_start';
                    title = "🌅 Nouvelle journée, nouvelle étape.";
                    body = "Coucou ! Prêt pour le Jour 2 ? On monte d'un cran aujourd'hui. Connecte-toi pour découvrir ta mission.";
                    url = '/dashboard';
                }
                // Rappel Jour 1 (Seulement le jour même du début)
                else if (!isNextDayPlus && challenge.started_at && !challenge.j1_completed) {
                    notifType = 'challenge_j1_reminder';
                    title = "🚀 On commence ensemble ?";
                    body = "Ton défi est lancé et le chrono tourne. Je sais que tu as ce qu'il faut pour valider ce Jour 1. Go !";
                    url = '/dashboard';
                } 
                // Succès Jour 1 (Félicitations immédiates après inactivité)
                else if (challenge.j1_completed && !challenge.j2_presented) {
                    notifType = 'challenge_j1_success';
                    title = "🌟 Fier de toi !";
                    body = "Le Jour 1 est dans la poche. Repose-toi bien, demain on attaque la suite. Tu as déjà fait le plus dur : commencer.";
                    url = '/dashboard';
                }

                // --- NIVEAUX D'INACTIVITÉ INTELLIGENTS (SI AUCUNE NOTIF PRIORITAIRE) ---
                if (!notifType) {
                    // Level 3 — Inactivité prolongée (72h+)
                    if (secondsSinceLastActivity >= 259200) {
                        notifType = 'inactivity_l3';
                        inactivityNeeded = 259200;
                        const msgs = [
                            { t: "💔 C'est donc ça la fin de ton projet ?", b: "Tu disais vouloir gagner de l'argent en ligne... C'était juste des mots ? Prouve-toi que tu vaux mieux que cet abandon." },
                            { t: "⚠️ Ton 'pourquoi' est en train de mourir", b: "Tu as commencé ce défi pour une raison précise. Aujourd'hui, tu l'oublies. Les gagnants finissent ce qu'ils commencent." },
                            { t: "🛑 Arrête de te mentir", b: "Dire qu'on veut réussir est facile. Agir l'est moins. Tu es à un clic de reprendre le contrôle ou d'assumer l'échec." }
                        ];
                        const pick = msgs[Math.floor(Math.random() * msgs.length)];
                        title = pick.t;
                        body = pick.b;
                        url = '/dashboard';
                    }
                    // Level 2 — Ignore la première notification (48h+)
                    else if (secondsSinceLastActivity >= 172800) {
                        notifType = 'inactivity_l2';
                        inactivityNeeded = 172800;
                        const msgs = [
                            { t: "🔍 Alima a commencé en même temps que toi...", b: "Elle vient de valider sa première commission. Tu as tout ce qu'il faut pour faire de même, reviens vite !" },
                            { t: "📍 Quelqu'un près de chez toi a réussi", b: "Un membre de ta région vient de terminer le défi 3 jours. Et toi, où en es-tu dans ta progression ?" },
                            { t: "💬 « Je n'y croyais pas, et pourtant... »", b: "C'est le message qu'on a reçu d'un membre qui était bloqué au même stade que toi. Reprends ton élan." }
                        ];
                        const pick = msgs[Math.floor(Math.random() * msgs.length)];
                        title = pick.t;
                        body = pick.b;
                        url = '/dashboard';
                    }
                    // Level 1 — Première absence (24h+)
                    else if (secondsSinceLastActivity >= 86400) {
                        notifType = 'inactivity_l1';
                        inactivityNeeded = 86400;
                        const msgs = [
                            { t: "👋 Hey, ton défi t'attend toujours 🔥", b: "Chaque jour compte dans ton évolution. Reviens continuer là où tu t'es arrêté." },
                            { t: "🚀 Ton élan est précieux", b: "Tu étais bien parti... ne casse pas cette dynamique maintenant. Ton futur toi te remerciera." },
                            { t: "⚡ Ne laisse pas le chrono gagner", b: "Ton Jour 2 ou 3 est prêt. Connecte-toi pour valider l'étape et passer au niveau supérieur." }
                        ];
                        const pick = msgs[Math.floor(Math.random() * msgs.length)];
                        title = pick.t;
                        body = pick.b;
                        url = '/dashboard';
                    }
                }

                // CHECK INACTIVITY DURATION
                if (notifType && secondsSinceLastActivity < inactivityNeeded) {
                    console.log(`[Dispatcher] User ${userId} matches ${notifType} but only inactive for ${Math.round(secondsSinceLastActivity)}s (Needs ${inactivityNeeded}s). Skipping.`);
                    notifType = null;
                }

                if (notifType) {
                    // Check log to avoid duplicate notifications
                    let hasBeenSent = false;
                    try {
                        const { data: log, error: logError } = await supabase
                            .from('mz_background_notifications_log')
                            .select('id')
                            .eq('user_id', userId)
                            .eq('notif_type', notifType)
                            .maybeSingle();

                        if (logError && logError.code !== '42P01') {
                            console.error(`[Dispatcher] Error checking log for ${userId}:`, logError);
                            continue;
                        }
                        if (log) hasBeenSent = true;
                    } catch (e) {
                        console.error('[Dispatcher] Unexpected error checking notification log:', e);
                    }

                    if (!hasBeenSent) {
                        const tokenStart = userData.fcm_token.substring(0, 10);
                        console.log(`[Dispatcher] Attempting to send ${notifType} to user ${userId} (Token start: ${tokenStart}...)`);
                        try {
                            const sendResult = await sendPush(userData.fcm_token, title, body, { url });
                            console.log(`[Dispatcher] sendPush result for ${userId}:`, sendResult);
                            
                            if (sendResult.success) {
                                // Add to log
                                const { error: insErr } = await supabase.from('mz_background_notifications_log').insert([{
                                    user_id: userId,
                                    notif_type: notifType
                                }]);
                                
                                if (insErr && insErr.code !== '42P01') {
                                    console.error('[Dispatcher] Error logging notification:', insErr);
                                }

                                // Mark state as presented in challenge table to sync UI
                                if (notifType === 'challenge_j1_success') {
                                    await supabase.from('mz_challenge_3j_state')
                                        .update({ j2_presented: true })
                                        .eq('user_id', userId);
                                }
                            }
                        } catch (pushErr) {
                            console.error(`[Dispatcher] Failed to send push to ${userId}:`, pushErr);
                        }
                    }
                }
            } catch (err: unknown) {
                const userErr = err as any;
                console.error(`[Dispatcher] Error processing user ${userId}:`, userErr.message || userErr);
            }
        }
    } catch (err: unknown) {
        const error = err as any;
        // Handle Error objects specially for JSON.stringify
        const errorDetail = {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            full: error
        };
        console.error('[Dispatcher] Error detail:', JSON.stringify(errorDetail, null, 2));
    }
}

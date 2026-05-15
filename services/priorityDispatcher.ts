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

        // 2. Filter these users by activity (must be inactive for > 60s)
        const today = new Date().toISOString().split('T')[0];
        const inactivityThreshold = new Date(Date.now() - 60000).toISOString(); 

        const { data: activeTracking, error: trackingError } = await supabase
            .from('mz_rewards_time_tracking')
            .select('user_id, last_ping')
            .eq('tracking_date', today)
            .in('user_id', challengeIds);

        if (trackingError && trackingError.code !== '42P01') {
            console.error('[Dispatcher] trackingError filtering active users:', trackingError);
            return;
        }

        // Users to target: Those who either have no ping today OR whose ping is < inactivityThreshold
        const targetUserIds = challengeIds.filter(userId => {
            const ping = activeTracking?.find(t => t.user_id === userId);
            if (!ping) return true; // No activity today = inactive
            return ping.last_ping < inactivityThreshold; // Last ping > 60s ago = inactive
        });

        if (targetUserIds.length === 0) {
            console.log('[Dispatcher] All targetable users are currently active. Skipping.');
            return;
        }

        // 3. Fetch user data for target IDs
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, fcm_token, full_name')
            .in('id', targetUserIds);

        if (usersError) {
            console.error('[Dispatcher] usersError:', usersError);
            throw usersError;
        }

        console.log(`[Dispatcher] Found ${usersData?.length || 0} inactive users with pending challenges. Processing...`);

        for (const userData of (usersData || [])) {
            const userId = userData.id;
            try {
                if (!userData.fcm_token) {
                    console.log(`[Dispatcher] User ${userId} has no FCM token. Skipping.`);
                    continue;
                }
                
                const { data: challenge, error: stateError } = await supabase
                    .from('mz_challenge_3j_state')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (stateError) {
                    console.error(`[Dispatcher] Error fetching challenge state for ${userId}:`, stateError);
                    continue;
                }

                if (!challenge) {
                    console.log(`[Dispatcher] User ${userId} has no challenge state.`);
                }

                const hasActiveChallenge = challenge && !challenge.j2_presented && !challenge.cancelled && (!challenge.j3_completed);
                console.log(`[Dispatcher] User ${userId} hasActiveChallenge: ${hasActiveChallenge}`);

                let notifType: string | null = null;
                let title = '';
                let body = '';
                let url = '/';

                // PRIORITÉ 1 : LE DÉFI (SI ACTIF)
                if (hasActiveChallenge) {
                    const startedAtDate = challenge.started_at ? new Date(challenge.started_at).toISOString().split('T')[0] : null;
                    const isNextDayPlus = startedAtDate && startedAtDate < today;

                    // Message du Jour 2 (Automatique le lendemain, qu'il ait fini J1 ou non)
                    if (isNextDayPlus && !challenge.j2_started_at && !challenge.j2_completed) {
                        notifType = 'challenge_j2_start';
                        title = "🌅 Le défi continue.";
                        body = "🔥 C'est le Jour 2. Prêt à franchir une nouvelle étape ? Connecte-toi.";
                        url = '/dashboard';
                    }
                    // Rappel Jour 1 (Seulement le jour même du début)
                    else if (!isNextDayPlus && challenge.started_at && !challenge.j1_completed) {
                        notifType = 'challenge_j1_reminder';
                        title = "👋 Hey, c’est moi Axis.";
                        body = "🔥 Ton défi est officiellement lancé. 🚀 Continue maintenant.";
                        url = '/dashboard';
                    } 
                    // Succès Jour 1 (Félicitations immédiates après inactivité)
                    else if (challenge.j1_completed && !challenge.j2_presented) {
                        notifType = 'challenge_j1_success';
                        title = "🎉 Jour 1 validé.";
                        body = "👋 Bon travail. 🔥 Le plus important aujourd’hui était de commencer.";
                        url = '/dashboard';
                    }
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

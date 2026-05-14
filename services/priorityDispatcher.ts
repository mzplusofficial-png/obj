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
        const inactivityThreshold = new Date(Date.now() - 60000).toISOString(); // Exactly 60s threshold
        
        // 1. Fetch users from time tracking (active today but inactive for > 60s)
        const today = new Date().toISOString().split('T')[0];
        
        // Use a wrapper to handle potential "table not found" errors
        const fetchTracking = async () => {
            try {
                const { data, error } = await supabase
                    .from('mz_rewards_time_tracking')
                    .select('user_id, last_ping')
                    .eq('tracking_date', today)
                    .lt('last_ping', inactivityThreshold);
                
                if (error) {
                    if (error.code === '42P01') {
                        console.warn('[Dispatcher] Table mz_rewards_time_tracking not found. Skipping time-based notifications.');
                        return { data: [], error: null };
                    }
                    return { data: null, error };
                }
                return { data, error: null };
            } catch (e) {
                console.error('[Dispatcher] Unexpected error querying mz_rewards_time_tracking:', e);
                return { data: [], error: null };
            }
        };

        const { data: trackingEntries, error: trackingError } = await fetchTracking();

        // 2. Also fetch users with active challenges
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

        if (trackingError) {
            console.error('[Dispatcher] trackingError:', JSON.stringify(trackingError));
            // Don't throw, just log and continue if possible or stop this cycle
            return;
        }
        if (challengeError) {
            console.error('[Dispatcher] challengeError:', JSON.stringify(challengeError));
            return;
        }
        
        const trackingIds = trackingEntries?.map(u => u.user_id) || [];
        const challengeIds = challengeUsers?.map(c => c.user_id) || [];
        
        // Dedup user IDs from both sources
        const uniqueUserIds = Array.from(new Set([...trackingIds, ...challengeIds]));
        
        if (uniqueUserIds.length === 0) {
            console.log('[Dispatcher] No potentially targetable users found.');
            return;
        }

        // Fetch user data for these IDs, including a loose "inactivity" check if we have last_ping
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, fcm_token, full_name')
            .in('id', uniqueUserIds);

        if (usersError) {
            console.error('[Dispatcher] usersError:', usersError);
            throw usersError;
        }

        console.log(`[Dispatcher] Found ${usersData?.length || 0} potentially inactive users. Processing...`);

        for (const userData of (usersData || [])) {
            const userId = userData.id;
            try {
                if (!userData.fcm_token) {
                    console.log(`[Dispatcher] User ${userId} has no FCM token. Skipping.`);
                    continue;
                }
                
                // If we have a ping, ensure they ARE inactive
                const pingEntry = trackingEntries?.find(t => t.user_id === userId);
                if (pingEntry && pingEntry.last_ping >= inactivityThreshold) {
                    console.log(`[Dispatcher] User ${userId} is still active (${pingEntry.last_ping}). Skipping.`);
                    continue; // Still active
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

                const hasActiveChallenge = challenge && !challenge.cancelled && !challenge.j3_completed;
                console.log(`[Dispatcher] User ${userId} hasActiveChallenge: ${hasActiveChallenge}`);

                let notifType: string | null = null;
                let title = '';
                let body = '';
                let url = '/';

                // PRIORITÉ 1 : LE DÉFI (SI ACTIF)
                if (hasActiveChallenge) {
                    // --- JOUR 1 ---
                    // Case 1: Started but NOT completed Day 1
                    if (challenge.presented && challenge.started_at && !challenge.j1_completed) {
                        notifType = 'challenge_j1_reminder';
                        title = "👋 Hey, c’est moi Axis.";
                        body = "🔥 Ton défi est officiellement lancé. 🚀 Continue maintenant.";
                        url = '/dashboard';
                    } 
                    // Case 2: Completed Day 1 but not yet presented Day 2
                    else if (challenge.j1_completed && !challenge.j2_presented) {
                        notifType = 'challenge_j1_success';
                        title = "🎉 Jour 1 validé.";
                        body = "👋 Bon travail. 🔥 Le plus important aujourd’hui était de commencer.";
                        url = '/dashboard';
                    }
                    // --- JOUR 2 ---
                    // Case 3: Day 2 presented but NOT completed (Nudge for first sale)
                    else if (challenge.j2_presented && !challenge.j2_completed) {
                        notifType = 'challenge_j2_reminder';
                        title = "💰 Jour 2 : Ta Première Vente !";
                        body = "🚀 Axis est prêt. Ton objectif : faire ta première vente aujourd'hui. On y va ?";
                        url = '/dashboard';
                    }
                    // Case 4: Day 2 completed but not yet presented Day 3 (Congrats for the sale)
                    else if (challenge.j2_completed && !challenge.j3_presented) {
                        notifType = 'challenge_j2_success';
                        title = "🔥 INCROYABLE ! Jour 2 validé.";
                        body = "💰 Tu as fait ta première vente ! C'est le début de quelque chose de grand. Demain, étape finale.";
                        url = '/dashboard';
                    }
                }

                if (notifType) {
                    // Check log
                    let hasBeenSent = false;
                    try {
                        const { data: log, error: logError } = await supabase
                            .from('mz_background_notifications_log')
                            .select('id')
                            .eq('user_id', userId)
                            .eq('notif_type', notifType)
                            .maybeSingle();

                        if (logError) {
                            if (logError.code === '42P01') {
                                console.warn('[Dispatcher] Table mz_background_notifications_log missing. Proceeding without log check.');
                            } else {
                                console.error(`[Dispatcher] Error checking log for ${userId}:`, logError);
                                continue;
                            }
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
                                const { error: insErr } = await supabase.from('mz_background_notifications_log').insert([{
                                    user_id: userId,
                                    notif_type: notifType
                                }]);
                                if (insErr && insErr.code !== '42P01') {
                                    console.error('[Dispatcher] Error logging notification:', insErr);
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

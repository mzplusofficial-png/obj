import { createClient } from '@supabase/supabase-js';
import { initAdmin, sendPush } from '../notifications.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ydkicdhcylpdffuzgdvm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for backend bypass

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');

export async function runPriorityDispatcher() {
    console.log('[Dispatcher] Checking for pending background notifications...');
    
    try {
        const oneMinuteAgo = new Date(Date.now() - 60100).toISOString(); // 60s + a bit of buffer
        
        // Fetch users active today but not in the last minute
        const today = new Date().toISOString().split('T')[0];
        
        // Optimisation : split the query if the join fails due to schema cache issues
        const { data: trackingEntries, error: trackingError } = await supabase
            .from('mz_rewards_time_tracking')
            .select('user_id, last_ping')
            .eq('tracking_date', today)
            .lt('last_ping', oneMinuteAgo)
            .order('last_ping', { ascending: false });

        if (trackingError) throw trackingError;
        if (!trackingEntries || trackingEntries.length === 0) return;

        // Dedup user IDs
        const uniqueUserIds = Array.from(new Set(trackingEntries.map(u => u.user_id)));

        // Fetch user data for these IDs
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, fcm_token, full_name')
            .in('id', uniqueUserIds);

        if (usersError) throw usersError;

        console.log(`[Dispatcher] Found ${uniqueUserIds.length} potentially inactive users. Processing...`);

        for (const userId of uniqueUserIds) {
            try {
                const userState = trackingEntries.find(u => u.user_id === userId);
                const userData = usersData?.find(u => u.id === userId);
                
                if (!userData?.fcm_token) continue;

                const { data: challenge } = await supabase
                    .from('mz_challenge_3j_state')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                const hasActiveChallenge = challenge && !challenge.cancelled && (!challenge.j3_completed);

                let notifType: string | null = null;
                let title = '';
                let body = '';
                let url = '/';

                // PRIORITÉ 1 : LE DÉFI (SI ACTIF)
                if (hasActiveChallenge) {
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
                }

                if (notifType) {
                    // Check log
                    const { data: log } = await supabase
                        .from('mz_background_notifications_log')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('notif_type', notifType)
                        .maybeSingle();

                    if (!log) {
                        console.log(`[Dispatcher] Attempting to send ${notifType} to user ${userId}`);
                        try {
                            const sendResult = await sendPush(userData.fcm_token, title, body, { url });
                            console.log(`[Dispatcher] sendPush result for ${userId}:`, sendResult);
                            
                            await supabase.from('mz_background_notifications_log').insert([{
                                user_id: userId,
                                notif_type: notifType
                            }]);
                        } catch (pushErr) {
                            console.error(`[Dispatcher] Failed to send push to ${userId}:`, pushErr);
                        }
                    }
                }
            } catch (userErr: any) {
                console.error(`[Dispatcher] Error processing user ${userId}:`, userErr.message);
            }
        }
    } catch (err: any) {
        console.error('[Dispatcher] Error detail:', {
            message: err?.message,
            details: err?.details,
            hint: err?.hint,
            code: err?.code,
            full: err
        });
    }
}

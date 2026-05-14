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
        
        const { data: inactiveUsers, error } = await supabase
            .from('mz_rewards_time_tracking')
            .select(`
                user_id,
                last_ping,
                users(fcm_token, full_name)
            `)
            .eq('tracking_date', today)
            .lt('last_ping', oneMinuteAgo)
            .order('last_ping', { ascending: false });

        if (error) throw error;
        if (!inactiveUsers || inactiveUsers.length === 0) return;

        // Dedup user IDs
        const uniqueUserIds = Array.from(new Set(inactiveUsers.map(u => u.user_id)));

        for (const userId of uniqueUserIds) {
            const userState = inactiveUsers.find(u => u.user_id === userId);
            const userData = userState?.users as any;
            
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
            } else {
                // PRIORITÉ 2 : AUTRES NOTIFICATIONS (XP, RAPPELS, etc.)
                // On n'envoie rien d'autre ici pour l'instant car l'utilisateur a demandé 
                // que les notifications défi passent avant tout.
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
                    console.log(`[Dispatcher] Sending ${notifType} to user ${userId}`);
                    await sendPush(userData.fcm_token, title, body, { url });
                    
                    await supabase.from('mz_background_notifications_log').insert([{
                        user_id: userId,
                        notif_type: notifType
                    }]);
                }
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

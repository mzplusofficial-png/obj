import { createClient } from '@supabase/supabase-js';

const RAW_URL = process.env.VITE_SUPABASE_URL || 'https://ydkicdhcylpdffuzgdvm.supabase.co';
const SUPABASE_URL = RAW_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON || '');

async function checkTables() {
    console.log('--- Database Health Check ---');
    console.log('URL:', SUPABASE_URL);
    console.log('Using Service Role:', !!SUPABASE_SERVICE_ROLE_KEY);
    
    const tables = [
        'users',
        'mz_rewards_time_tracking',
        'mz_challenge_3j_state',
        'mz_background_notifications_log',
        'mz_app_config'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
            console.error(`[FAIL] Table ${table}:`, error.message, `(Code: ${error.code})`);
        } else {
            console.log(`[OK] Table ${table}`);
        }
    }
}

checkTables();

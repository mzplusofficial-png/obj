import { supabase } from './supabase';

export type TriggerType = 'popup' | 'axis' | 'push';
export type Scenario = 'mission_complete' | 'click_spike' | 'fallback';

export interface ScenicMessage {
  type: TriggerType;
  message: string;
}

interface TriggerMessage {
  scenario: Scenario;
  type: TriggerType;
  messages: string[];
}

const MESSAGE_BANK: TriggerMessage[] = [
  {
    scenario: 'mission_complete',
    type: 'popup',
    messages: [
      "🔥 Bravo... tu viens de terminer cette mission. Mais savais-tu que certains membres obtiennent leurs résultats jusqu’à 5x plus vite sur MZ+ Premium ?",
      "🚀 Tu progresses bien. Imagine maintenant avec les outils Premium débloqués.",
      "⚡ Les membres Premium passent souvent plus vite à l’action... et aux résultats."
    ]
  },
  {
    scenario: 'mission_complete',
    type: 'axis',
    messages: [
      "👁️ Beau travail sur cette mission. Le passage au Premium pourrait multiplier ta vitesse par 5.",
      "🚀 Félicitations ! Les outils de l'Arène Élite t'attendent pour passer au niveau supérieur.",
      "⚡ Ta progression est constante. En Premium, elle devient explosive."
    ]
  },
  {
    scenario: 'mission_complete',
    type: 'push',
    messages: [
      "🔥 Une mission accomplie ! Débloque Premium pour 5x plus de résultats.",
      "🚀 Ne t'arrête pas là. Les membres Elite t'attendent.",
      "⚡ Ta progression mérite l'accélérateur Premium."
    ]
  },
  {
    scenario: 'click_spike',
    type: 'popup',
    messages: [
      "👀 Wouah... ta boutique attire vraiment du monde 🔥",
      "🚀 Tu as obtenu un pic de trafic impressionnant en seulement 24h.",
      "⚡ Et si tu transformais maintenant ces clics en ventes grâce à Premium ?",
      "💰 Beaucoup de membres Premium utilisent ces moments pour accélérer leurs résultats."
    ]
  },
  {
    scenario: 'click_spike',
    type: 'axis',
    messages: [
      "📈 Ton trafic explose ! C'est le moment idéal pour débloquer les outils de conversion Premium.",
      "💰 Tes liens chauffent ! Ne laisse aucun profit s'échapper, passe à la version Elite.",
      "🚀 Alerte Trafic : Ta visibilité est au max. Optimise tes gains avec MZ+ Premium."
    ]
  },
  {
    scenario: 'click_spike',
    type: 'push',
    messages: [
      "📈 Ta boutique explose ! Passe Premium pour encaisser tes gains.",
      "💰 +10 clics en un éclair ! Optimise ta conversion avec Elite.",
      "🚀 Pic de trafic détecté ! Ne laisse aucun profit s'échapper."
    ]
  },
  {
    scenario: 'fallback',
    type: 'axis',
    messages: [
      "💡 Savais-tu que l'Arène Élite permet de doubler ses commissions ?",
      "🚀 Ta route vers le succès est tracée. Le Premium est ton accélérateur.",
      "💎 Rejoins le cercle des 1%. Le Premium n'est pas une dépense, c'est un investissement."
    ]
  }
];

const TRIGGER_HISTORY_LIMIT = 10;
const COOLDOWN_HOURS = 3;

export class PremiumTriggerEngine {
  static async trigger(userId: string, scenario: Scenario, forceType?: TriggerType) {
    // 1. Récupérer les données de l'utilisateur (niveau et dernier trigger)
    const { data: profile, error } = await supabase
      .from('users')
      .select('user_level, last_premium_trigger_at, premium_trigger_history')
      .eq('id', userId)
      .single();

    if (error || !profile || profile.user_level === 'niveau_mz_plus') return null;

    // 2. Vérification du Cooldown (3h entre chaque trigger)
    if (profile.last_premium_trigger_at && scenario !== 'fallback') {
      const lastTrigger = new Date(profile.last_premium_trigger_at).getTime();
      const diff = Date.now() - lastTrigger;
      if (diff < COOLDOWN_HOURS * 60 * 60 * 1000) {
        console.log(`[PremiumTrigger] Cooldown active. Next possible in ${Math.round((COOLDOWN_HOURS * 60 * 60 * 1000 - diff) / 60000)} mins`);
        return null;
      }
    }

    // 3. Logique de sélection
    const types: TriggerType[] = ['popup', 'axis'];
    const selectedType = forceType || types[Math.floor(Math.random() * types.length)];
    
    const bankEntry = MESSAGE_BANK.find(m => m.scenario === scenario && m.type === selectedType);
    if (!bankEntry) return null;

    const message = bankEntry.messages[Math.floor(Math.random() * bankEntry.messages.length)];

    // 4. Enregistrer dans la base de données
    const newHistory = [
      { scenario, type: selectedType, timestamp: new Date().toISOString() },
      ...(profile.premium_trigger_history || [])
    ].slice(0, TRIGGER_HISTORY_LIMIT);

    await supabase.from('users').update({
      last_premium_trigger_at: new Date().toISOString(),
      premium_trigger_history: newHistory
    }).eq('id', userId);

    return { type: selectedType, message };
  }

  static async registerPushTrigger(userId: string, scenario: Scenario) {
    const { data: profile } = await supabase.from('users').select('user_level').eq('id', userId).single();
    if (profile?.user_level === 'niveau_mz_plus') return;

    const bankEntry = MESSAGE_BANK.find(m => m.scenario === scenario && m.type === 'push');
    if (!bankEntry) return;

    const message = bankEntry.messages[Math.floor(Math.random() * bankEntry.messages.length)];

    await supabase.from('internal_notifications').insert({
      recipient_id: userId,
      sender_id: 'system',
      type: 'premium_upsell',
      message: message,
      is_read: false,
      metadata: { scenario }
    });
  }

  static async reportActivity(userId: string) {
    await supabase.from('users').update({ last_active_at: new Date().toISOString() }).eq('id', userId);
  }
}

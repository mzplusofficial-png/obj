import { TRIGGER_PRIORITIES } from '../src/constants/triggerPriorities';
import { supabase } from './supabase';

export type TriggerType = 'popup' | 'axis' | 'push';
export type Scenario = 'mission_complete' | 'click_spike' | 'fallback';

export interface ScenicMessage {
  type: TriggerType;
  message: string;
  priority?: number;
}

interface TriggerMessage {
  scenario: Scenario;
  type: TriggerType;
  messages: string[];
  ctas?: string[];
}

const MESSAGE_BANK: TriggerMessage[] = [
  {
    scenario: 'mission_complete',
    type: 'popup',
    messages: [
      "🔥 Tu viens de valider une étape cruciale. Bravo ! Mais soyons honnêtes : pendant que tu travailles dur, les membres Premium ont déjà automatisé tout ça et multiplient leurs profits par 10. Tu veux continuer à ramer ou enfin encaisser ?",
      "🏆 Mission terminée ! Tu as le talent, c'est certain. Mais sans l'arsenal Premium, c'est comme essayer de gagner une course de F1 en vélo. Libère ta puissance maximale maintenant.",
      "🚀 Félicitations ! Te voilà plus proche du but. Savais-tu que les membres qui réussissent ici sont passés Premium pour ne plus jamais avoir à se soucier de la technique ? Ta liberté n'attend que toi."
    ],
    ctas: [
      "Je veux encaisser maintenant 💰",
      "Débloquer mon arsenal F1 🏎️",
      "Prendre ma liberté 🚀"
    ]
  },
  {
    scenario: 'mission_complete',
    type: 'axis',
    messages: [
      "Hey, savais-tu que ta boutique pourrait faire des ventes en automatique même pendant que tu dors ? Les membres Premium le font déjà, pourquoi pas toi ?",
      "✨ Mission validée ! Imagine si chaque clic te rapportait 3x plus d'argent dès maintenant... C'est la réalité de nos membres Premium.",
      "⚡ Fière de ta progression ? Ne t'arrête pas en si bon chemin. Rejoins le club Premium et transforme tes efforts en revenus passifs."
    ],
    ctas: [
      "Activer l'automatique ⚡",
      "Multiplier mes gains 📈",
      "Passer Premium 💎"
    ]
  },
  {
    scenario: 'mission_complete',
    type: 'push',
    messages: [
      "🔥 Mission accomplie ! Débloque Premium pour 5x plus de résultats.",
      "🚀 Ne t'arrête pas là. Les membres Premium t'attendent pour passer à l'action.",
      "⚡ Ta progression mérite l'accélérateur Premium."
    ]
  },
  {
    scenario: 'click_spike',
    type: 'popup',
    messages: [
      "👀 Warning : Ton trafic explose ! C'est le moment exact où tu peux bâtir ta fortune... ou tout laisser filer. Sans les outils Premium, 80% de tes commissions s'évaporent. Ne laisse plus cet argent s'échapper !",
      "📈 Alerte Succès : Tes liens chauffent à blanc ! Les amateurs s'en réjouissent, les membres Premium en profitent pour encaisser. Dans quel camp veux-tu être aujourd'hui ?",
      "💰 Ton compteur s'affole ! Tu as attiré l'attention, maintenant capte le profit. Active Premium pour transformer ce pic de trafic en une machine à cash durable."
    ],
    ctas: [
      "Verrouiller mes commissions 🔒",
      "Rejoindre le camp des gagnants 🏆",
      "Activer la machine à cash 💰"
    ]
  },
  {
    scenario: 'click_spike',
    type: 'axis',
    messages: [
      "🔥 Tes liens sont en feu ! Savais-tu qu'en mode Premium, tu aurais déjà pu doubler tes commissions sur ces clics ?",
      "📈 Tes courbes s'envolent ! Ne laisse aucun euro sur la table. Passe Premium pour verrouiller tes profits maintenant.",
      "⚡ Flash Info : Tes stats explosent ! C'est le moment idéal pour activer Premium et sécuriser ta liberté financière."
    ],
    ctas: [
      "Doubler mes commissions ⚡",
      "Tout verrouiller 🔒",
      "Activer Premium 💍"
    ]
  },
  {
    scenario: 'click_spike',
    type: 'push',
    messages: [
      "📈 Ta boutique explose ! Passe Premium pour ne laisser aucun profit s'échapper.",
      "💰 +10 clics en un éclair ! Optimise ta conversion avec Premium.",
      "🚀 Pic de trafic détecté ! Verrouille tes gains avec Premium."
    ]
  },
  {
    scenario: 'fallback',
    type: 'axis',
    messages: [
      "💡 Marre de travailler pour des miettes ? L'Arène Premium génère des revenus même quand tu dors. Pourquoi attendre ?",
      "💎 Ta liberté financière n'est qu'à un clic. Le Premium est ta seule clé pour quitter le système définitivement.",
      "🚀 Ne regarde plus les autres réussir. Prends ta place parmi les membres Premium et commence à voir de vrais chiffres."
    ],
    ctas: [
      "Quitter les miettes 💰",
      "Débloquer ma liberté 💎",
      "Prendre ma place 🏆"
    ]
  }
];

const TRIGGER_HISTORY_LIMIT = 10;
const COOLDOWN_HOURS = 3;

export class PremiumTriggerEngine {
  static async trigger(userId: string, scenario: Scenario, forceType?: TriggerType) {
    const priority = TRIGGER_PRIORITIES[scenario];

    // 1. Récupérer les données de l'utilisateur (niveau et dernier trigger)
    const { data: profile, error } = await supabase
      .from('users')
      .select('user_level, last_premium_trigger_at, premium_trigger_history')
      .eq('id', userId)
      .single();

    if (error || !profile || profile.user_level === 'niveau_mz_plus') return null;

    // 2. Vérification du Cooldown (3h entre chaque trigger, sauf si priorité supérieure ?)
    // Pour l'instant, on applique le cooldown global de 3h comme demandé
    if (profile.last_premium_trigger_at && scenario !== 'fallback') {
      const lastTrigger = new Date(profile.last_premium_trigger_at).getTime();
      const diff = Date.now() - lastTrigger;
      
      if (diff < COOLDOWN_HOURS * 60 * 60 * 1000) {
        console.log(`[PremiumTrigger] Cooldown active (Lvl ${priority}). Next possible in ${Math.round((COOLDOWN_HOURS * 60 * 60 * 1000 - diff) / 60000)} mins`);
        return null;
      }
    }

    // 3. Logique de sélection
    const types: TriggerType[] = ['popup', 'axis'];
    const selectedType = forceType || types[Math.floor(Math.random() * types.length)];
    
    const bankEntry = MESSAGE_BANK.find(m => m.scenario === scenario && m.type === selectedType);
    if (!bankEntry) return null;

    const messageIndex = Math.floor(Math.random() * bankEntry.messages.length);
    const message = bankEntry.messages[messageIndex];
    const cta = bankEntry.ctas ? bankEntry.ctas[messageIndex] : undefined;

    // 4. Enregistrer dans la base de données avec le niveau de priorité
    const newHistory = [
      { scenario, type: selectedType, priority, timestamp: new Date().toISOString() },
      ...(profile.premium_trigger_history || [])
    ].slice(0, TRIGGER_HISTORY_LIMIT);

    await supabase.from('users').update({
      last_premium_trigger_at: new Date().toISOString(),
      premium_trigger_history: newHistory
    }).eq('id', userId);

    return { type: selectedType, message, priority, cta };
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

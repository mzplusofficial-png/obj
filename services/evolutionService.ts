import { supabase } from './supabase';

export interface MemberEvolution {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  old_level?: string;
  new_level?: string;
  type: 'level_up' | 'formation_completed' | 'achievement_unlocked';
  achievement_title?: string;
  message: string;
  created_at: string;
  reactions: Record<string, number>;
  user_reactions?: Record<string, Record<string, boolean>>; // userId -> { type: true }
  comment_count: number;
}

const EVOLUTIONS_TABLE = 'member_evolutions';

export const shareEvolution = async (evolution: Omit<MemberEvolution, 'id' | 'created_at' | 'reactions' | 'comment_count'>) => {
  try {
    const { data, error } = await supabase
      .from(EVOLUTIONS_TABLE)
      .insert({
        ...evolution,
        reactions: {},
        user_reactions: {},
        comment_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error sharing evolution:", error);
    throw error;
  }
};

export const subscribeToEvolutions = (callback: (evolutions: MemberEvolution[]) => void) => {
  // Initial fetch
  const fetchEvolutions = async () => {
    const { data, error } = await supabase
      .from(EVOLUTIONS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      callback(data as MemberEvolution[]);
    }
  };

  fetchEvolutions();

  // Real-time subscription
  const subscription = supabase
    .channel('member_evolutions_realtime')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: EVOLUTIONS_TABLE 
    }, () => {
      fetchEvolutions(); // Refresh on any change
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const reactToEvolution = async (evolutionId: string, userId: string, reactionType: string) => {
  try {
    const { data: current } = await supabase
      .from(EVOLUTIONS_TABLE)
      .select('reactions, user_reactions')
      .eq('id', evolutionId)
      .single();

    const userReactions = { ...(current?.user_reactions || {}) };
    const reactions = { ...(current?.reactions || {}) };

    if (!userReactions[userId]) {
      userReactions[userId] = {};
    }

    const hasThisReaction = userReactions[userId][reactionType];
    
    if (hasThisReaction) {
      // Toggle off
      delete userReactions[userId][reactionType];
      reactions[reactionType] = Math.max(0, (reactions[reactionType] || 1) - 1);
    } else {
      // Toggle on
      userReactions[userId][reactionType] = true;
      reactions[reactionType] = (reactions[reactionType] || 0) + 1;
    }

    const { error } = await supabase
      .from(EVOLUTIONS_TABLE)
      .update({ 
        reactions: reactions,
        user_reactions: userReactions 
      })
      .eq('id', evolutionId);

    if (error) throw error;
  } catch (error) {
    console.error("Error reacting to evolution:", error);
  }
};

export const getEvolutionMessages = (_userName: string, levelName: string) => {
  const messages = [
    `🚀 Incroyable ! Je viens de franchir une étape majeure et je passe au niveau ${levelName} sur MZ+ ! L'ascension continue. 🔥`,
    `💎 Objectif pulvérisé ! Je suis désormais officiellement au niveau ${levelName} sur MZ+. Fier de mon parcours ! 📈`,
    `⚡️ Nouvelle victoire ! Je viens d'atteindre le niveau ${levelName} sur MZ+. Le travail finit toujours par payer. 🎯`,
    `🌟 C'est fait ! Je monte en puissance et je rejoins le rang ${levelName} sur MZ+. On ne s'arrête plus ! 💰`
  ];
  return messages;
};

export const generateWhatsAppLink = (message: string) => {
  const encodedMessage = encodeURIComponent(message + "\n\nRejoins nous ici : https://chat.whatsapp.com/KlQpX9TS1MpEjysyOSwMrd");
  return `https://wa.me/?text=${encodedMessage}`;
};

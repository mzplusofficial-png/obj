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

export const checkIfLevelShared = async (userId: string, levelName: string) => {
  try {
    const { data, error } = await supabase
      .from(EVOLUTIONS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('new_level', levelName)
      .eq('type', 'level_up')
      .maybeSingle();
    
    if (error) return false;
    return !!data;
  } catch (error) {
    console.error("Error checking shared level:", error);
    return false;
  }
};

export const checkIfAchievementShared = async (userId: string, achievementTitle: string) => {
  try {
    const { data, error } = await supabase
      .from(EVOLUTIONS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('new_level', achievementTitle)
      .eq('type', 'achievement_unlocked')
      .maybeSingle();
    
    if (error) return false;
    return !!data;
  } catch (error) {
    console.error("Error checking shared achievement:", error);
    return false;
  }
};

export const reactToEvolution = async (evolutionId: string, userId: string, reactionType: string) => {
  try {
    const { data: current, error: fetchError } = await supabase
      .from(EVOLUTIONS_TABLE)
      .select('reactions, user_reactions')
      .eq('id', evolutionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST204') {
        console.warn("Column user_reactions missing. Please run the migration script.");
      }
      throw fetchError;
    }

    const userReactions = current?.user_reactions ? { ...current.user_reactions } : {};
    const reactions = current?.reactions ? { ...current.reactions } : {};

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

    const { error: updateError } = await supabase
      .from(EVOLUTIONS_TABLE)
      .update({ 
        reactions,
        user_reactions: userReactions 
      })
      .eq('id', evolutionId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error("Error in reactToEvolution:", error);
  }
};

export const getRandomMessage = (type: 'level_up' | 'challenge' | 'mission', data: { userName?: string; levelName?: string; day?: number; missionTitle?: string }) => {
  const levelUpMessages = [
    `🔥 ENFIN ! Je viens de franchir un cap énorme et je passe officiellement au niveau ${data.levelName} sur MZ+ ! L'ascension continue.`,
    `💎 Je n'en reviens pas, niveau ${data.levelName} atteint ! Fier de ma progression et de ne rien avoir lâché sur MZ+.`,
    `🚀 Nouvelle étape validée ! J'atteins le niveau ${data.levelName} et je sens que je passe enfin un cap supérieur.`,
    `🌟 C'est fait ! Ma détermination paye enfin, je rejoins le rang ${data.levelName}. On ne s'arrête plus maintenant !`,
    `💪 Tellement fier d'annoncer que je suis désormais niveau ${data.levelName} ! MZ+ change vraiment la donne pour moi.`,
    `⚡️ Boom ! Niveau ${data.levelName} dans la poche. Je monte en puissance de jour en jour !`,
    `🎯 Objectif atteint : je suis officiellement au niveau ${data.levelName}. La route a été intense mais ça en valait la peine !`,
    `👑 Nouveau statut débloqué : ${data.levelName}. Fier de voir mon travail acharné porter ses fruits sur MZ+ !`
  ];

  const challengeMessages = [
    `🔥 Jour ${data.day} du Défi 3 Jours VALIDÉ ! Je ne lâche rien, la discipline paye. 🚀`,
    `💪 Encore une étape franchie ! Mon Défi Jour ${data.day} est dans la poche. Objectif 100% de réussite !`,
    `🚀 Le Jour ${data.day} de mon défi MZ+ est terminé. Je sens que je progresse chaque jour un peu plus !`,
    `⚡️ Pas d'excuses, juste des résultats. Jour ${data.day} du défi complété avec succès sur MZ+ !`,
    `🎯 Défi Jour ${data.day} validé ! L'élan est là, je fonce vers la ligne d'arrivée. 🔥`,
    `🌟 Quelle satisfaction ! Je viens de finir le Jour ${data.day} du défi 3 jours. On continue !`
  ];

  const missionMessages = [
    `🔥 Mission accomplie : ${data.missionTitle} ! Je monte en puissance sur MZ+. 🚀`,
    `💎 Une victoire de plus ! Je viens de terminer la mission "${data.missionTitle}". On ne s'arrête pas !`,
    `⚡️ Mission "${data.missionTitle}" validée ! Le travail finit toujours par payer. 💪`,
    `🎯 Objectif rempli pour la mission ${data.missionTitle}. Fier de mon avancée sur la plateforme !`,
    `🚀 Boom ! Mission ${data.missionTitle} dans la poche. L'ascension MZ+ continue !`,
    `🌟 C'est fait ! Je viens de boucler la mission "${data.missionTitle}". Fier de mon focus !`
  ];

  let pool = levelUpMessages;
  if (type === 'challenge') pool = challengeMessages;
  if (type === 'mission') pool = missionMessages;

  return pool[Math.floor(Math.random() * pool.length)];
};

export const getEvolutionMessages = (_userName: string, levelName: string) => {
  // Maintaining compatibility for level_up shares
  const allPossible = [
    `🔥 ENFIN ! Je viens de franchir un cap énorme et je passe officiellement au niveau ${levelName} sur MZ+ ! L'ascension continue.`,
    `💎 Je n'en reviens pas, niveau ${levelName} atteint ! Fier de ma progression et de ne rien avoir lâché sur MZ+.`,
    `🚀 Nouvelle étape validée ! J'atteins le niveau ${levelName} et je sens que je passe enfin un cap supérieur.`,
    `🌟 C'est fait ! Ma détermination paye enfin, je rejoins le rang ${levelName}. On ne s'arrête plus maintenant !`,
    `💪 Tellement fier d'annoncer que je suis désormais niveau ${levelName} ! MZ+ change vraiment la donne pour moi.`,
    `⚡️ Boom ! Niveau ${levelName} dans la poche. Je monte en puissance de jour en jour !`
  ];
  return allPossible;
};

export const generateWhatsAppLink = (message: string) => {
  const appUrl = window.location.origin;
  const encodedMessage = encodeURIComponent(`${message}\n\nVoir mon évolution sur MZ+ : ${appUrl}?tab=community`);
  return `https://wa.me/?text=${encodedMessage}`;
};

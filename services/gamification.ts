import { supabase } from './supabase';

export const rewardUserXP = async (userId: string, xpAmount: number) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === '42703') {
        console.warn("L'XP n'a pas pu être ajoutée car la colonne 'xp' n'existe pas dans la table 'users'. Lancez la commande SQL fournie pour l'ajouter.");
        return false;
      }
      throw fetchError;
    }

    const currentXp = user?.xp || 0;

    const { error: updateError } = await supabase
      .from('users')
      .update({ xp: currentXp + xpAmount })
      .eq('id', userId);

    if (updateError) {
      if (updateError.code === '42703') {
        console.warn("L'XP n'a pas pu être ajoutée car la colonne 'xp' n'existe pas dans la table 'users'. Lancez la commande SQL fournie pour l'ajouter.");
        return false;
      }
      throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error("Error rewarding XP:", error);
    return false;
  }
};

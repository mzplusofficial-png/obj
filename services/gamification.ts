import { supabase } from './supabase';

export const rewardUserXP = async (userId: string, xpAmount: number) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('xp, weekly_xp, monthly_xp, last_xp_update')
      .eq('id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === '42703') {
        console.warn("L'XP n'a pas pu être ajoutée car les colonnes requises n'existent pas dans la table 'users'. Lancez la commande SQL fournie pour les ajouter.");
        return false;
      }
      throw fetchError;
    }

    const currentXp = user?.xp || 0;
    let currentWeeklyXp = user?.weekly_xp || 0;
    let currentMonthlyXp = user?.monthly_xp || 0;
    const lastXpUpdate = user?.last_xp_update ? new Date(user.last_xp_update) : new Date(0);
    
    // Check if last_xp_update is from a previous week
    const now = new Date();
    // Get Monday of the current week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
    startOfWeek.setHours(0, 0, 0, 0);

    if (lastXpUpdate < startOfWeek) {
      currentWeeklyXp = 0; // Reset weekly XP
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    if (lastXpUpdate < startOfMonth) {
      currentMonthlyXp = 0; // Reset monthly XP
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        xp: currentXp + xpAmount,
        weekly_xp: currentWeeklyXp + xpAmount,
        monthly_xp: currentMonthlyXp + xpAmount,
        last_xp_update: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      if (updateError.code === '42703') {
        console.warn("L'XP n'a pas pu être ajoutée car les colonnes n'existent pas dans la table 'users'. Lancez la commande SQL fournie.");
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

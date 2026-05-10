import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { UserProfile } from '../../../types';
import { RankCelebrationOverlay } from './RankCelebrationOverlay';

export const RankRewardChecker: React.FC<{ profile: UserProfile | null, onRedirectProfile?: () => void }> = ({ profile, onRedirectProfile }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!profile) return;
    
    // Si c'est le niveau 1 et qu'aucune offre/règle spéciale ne s'applique, généralement on ne donne pas de récompense (à confirmer ?)
    // Le prompt dit : "lorsque un utilsateur ugrade d'un autre niveau exemple de debutant as expert"
    // On va vérifier s'il existe une récompense non réclamée pour son niveau actuel.
    if (profile.rank_id <= 1) {
      setHasChecked(true);
      return;
    }

    const checkReward = async () => {
      try {
        const { data, error } = await supabase
          .from('user_rank_rewards')
          .select('id')
          .eq('user_id', profile.id)
          .eq('rank_id', profile.rank_id)
          .maybeSingle();

        if (error) console.error("Error checking user rank reward", error);
        
        if (!data) {
          // No claim for this rank yet, they just ranked up (or never claimed it)
          setShowCelebration(true);
        }
      } catch (e) {
        console.error("Error in reward checker", e);
      } finally {
        setHasChecked(true);
      }
    };

    checkReward();
  }, [profile?.id, profile?.rank_id]);

  if (!showCelebration || !profile) return null;

  return (
    <RankCelebrationOverlay 
      profile={profile} 
      onClose={() => {
        setShowCelebration(false);
        if (onRedirectProfile) onRedirectProfile();
      }} 
    />
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../services/supabase.ts';
import { UserProfile } from '../../../types.ts';
import { Users, TrendingUp, Star, Award, Copy, Share2, Crown, Zap, Activity, CheckCircle2, ChevronRight, Rocket, Gift } from 'lucide-react';
import { useCurrency } from '../../../hooks/useCurrency.ts';

interface Props {
  profile: UserProfile | null;
  teamCount: number; // Will use it for fallback or total
}

const MOTIVATIONAL_PHRASES = [
  "Ton réseau est ta plus grande richesse.",
  "Bâtis ta communauté, multiplie tes revenus.",
  "Les leaders ne suivent pas, ils construisent.",
  "Chaque invitation te rapproche de ton succès.",
  "L'empire que tu construis aujourd'hui paiera demain.",
  "Le succès n'est réel que lorsqu'il est partagé.",
  "Ton influence a une valeur inestimable."
];

export const ReferralDashboard: React.FC<Props> = ({ profile, teamCount }) => {
  const { convertAndFormat } = useCurrency();
  const [motivationalPhrase, setMotivationalPhrase] = useState(MOTIVATIONAL_PHRASES[0]);
  const [team, setTeam] = useState<{id: string, full_name: string, user_level: string, created_at: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOverlayGuide, setShowOverlayGuide] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('mz_referral_guide_seen');
    if (!seen) {
      setShowOverlayGuide(true);
    }
  }, []);

  const handleFinishOverlayGuide = () => {
    localStorage.setItem('mz_referral_guide_seen', 'true');
    setShowOverlayGuide(false);
  };

  const fetchTeam = useCallback(async (retryCount = 0) => {
    if (!profile?.referral_code) return;
    if (retryCount === 0) setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, user_level, created_at')
        .eq('referral_code_used', profile.referral_code)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTeam(data || []);
    } catch (e: unknown) {
      console.error("Team Fetch Error:", e);
      const isFetchError = e instanceof Error && (e.message.includes('fetch') || e.name === 'TypeError');
      if (retryCount < 3 && isFetchError) {
        const delay = 1000 * (retryCount + 1);
        setTimeout(() => fetchTeam(retryCount + 1), delay);
        return;
      }
      setError("Impossible de charger votre équipe pour le moment.");
    } finally {
      setLoading(false);
    }
  }, [profile?.referral_code]);

  useEffect(() => {
    fetchTeam();
    setMotivationalPhrase(MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]);
  }, [fetchTeam]);

  const premiumMembers = team.filter(m => m.user_level === 'niveau_mz_plus').length;
  const revenusGeneres = premiumMembers * 2500;
  const displayTeamCount = Math.max(team.length, teamCount);
  const xpGeneres = displayTeamCount * 10;

  const referralLink = `${window.location.origin}/?ref=${profile?.referral_code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins mon équipe sur MZ+',
          text: 'Développe tes revenus et rejoins ma communauté !',
          url: referralLink,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="pb-32 animate-in fade-in duration-700 bg-black min-h-[100dvh]">
      
      {showOverlayGuide && (
        <AxisFirstTimeGuide 
          onClose={handleFinishOverlayGuide} 
          convertAndFormat={convertAndFormat} 
        />
      )}

      {/* 1. HERO SECTION & STATS OVERLAY (Immersive App Feel) */}
      <div className="relative pt-12 pb-28 md:pt-16 md:pb-32 px-6 rounded-b-[2.5rem] md:rounded-b-[4rem] bg-gradient-to-b from-[#111009] via-[#0a0a0a] to-[#010101] border-b border-white/[0.02]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center mb-6 md:mb-8 border border-yellow-500/20 shadow-inner">
            <Rocket size={32} className="text-yellow-500 opacity-90 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60 tracking-tight leading-tight max-w-2xl mx-auto drop-shadow-sm">
            {motivationalPhrase}
          </h1>
        </div>
      </div>

      {/* 2. STATS & ACTIONS (Overlapping the hero section) */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-20 relative z-20">
        <div className="bg-[#050505] backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-6 md:p-10">
           
           <div className="grid grid-cols-2 gap-8 divide-x divide-white/5 mb-8 md:mb-10">
              <div className="flex flex-col items-center justify-center">
                 <p className="text-sm font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2 md:mb-3">Membres</p>
                 <div className="flex items-center gap-3">
                    <Users className="text-white/40 hidden sm:block" size={24} />
                    <p className="text-5xl md:text-6xl font-black text-white tracking-tighter">{displayTeamCount}</p>
                 </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                 <p className="text-sm font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2 md:mb-3">Revenus</p>
                 <div className="flex items-center gap-3">
                    <Crown className="text-yellow-500 hidden sm:block" size={24} />
                    <p className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                       {revenusGeneres > 0 ? convertAndFormat(revenusGeneres).formatted : '0'}
                    </p>
                 </div>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button 
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 md:py-5 bg-white text-black rounded-[1.25rem] font-black text-lg hover:bg-white/90 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <Share2 size={22} />
                Partager & Gagner
              </button>
              <button 
                onClick={handleCopy}
                className="sm:flex-none flex items-center justify-center gap-3 px-8 py-4 md:py-5 bg-[#111] border border-white/10 text-white rounded-[1.25rem] font-bold text-lg hover:bg-[#1a1a1a] hover:border-white/20 active:scale-95 transition-all"
              >
                {copied ? <CheckCircle2 size={22} className="text-green-400" /> : <Copy size={22} />}
                {copied ? "Copié" : "Copier"}
              </button>
           </div>
           
           {error && (
             <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
               <p className="text-sm font-bold text-red-500">{error}</p>
             </div>
           )}
        </div>
      </div>

      {/* 3. AXIS EXPLAINER & TEAM LIST (Flowing naturally) */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-12 space-y-12">
        <AxisExplainer convertAndFormat={convertAndFormat} />
        
        <div className="pt-4">
          <div className="flex items-center justify-between mb-8 px-2">
             <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
               <Activity className="text-white/40" size={20} />
               Ton Équipe
             </h2>
             <span className="text-sm font-bold text-neutral-500 bg-white/5 px-4 py-1.5 rounded-full">
               {displayTeamCount} membre{displayTeamCount > 1 ? 's' : ''}
             </span>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-4 md:p-6 shadow-xl">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-white/5 border-t-white/30 rounded-full animate-spin" />
                <p className="text-sm text-neutral-500 font-medium animate-pulse">Chargement...</p>
              </div>
            ) : team.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-white/5 to-white/10 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                  <Gift className="text-white/30" size={32} />
                </div>
                <p className="text-xl font-bold text-white mb-2">Aucun membre pour le moment</p>
                <p className="text-neutral-500 max-w-sm text-sm leading-relaxed mb-6">
                  Partage ton lien à tes contacts et sois récompensé pour chaque nouvelle inscription.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {team.map((member, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={member.id} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-[#111] hover:bg-[#151515] border border-white/5 hover:border-white/10 rounded-2xl transition-all"
                    >
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[1rem] flex items-center justify-center font-black text-lg shrink-0 ${
                            member.user_level === 'niveau_mz_plus' 
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                            : 'bg-gradient-to-br from-[#222] to-[#111] text-white border border-white/10'
                          }`}
                        >
                          {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-base md:text-lg">{member.full_name || 'Membre Anonyme'}</p>
                          <p className="text-xs md:text-sm text-neutral-500 mt-1">
                            {new Date(member.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric'})}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {member.user_level === 'niveau_mz_plus' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg border border-yellow-500/20">
                            <Crown size={14} className="fill-yellow-500" />
                            <span className="text-xs font-black uppercase tracking-wider hidden sm:block">Premium</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-neutral-400 rounded-lg">
                            <Activity size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Actif</span>
                          </div>
                        )}
                        <div className="flex items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-sm font-bold text-white/90">+10 XP</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AxisExplainer = ({ convertAndFormat }: { convertAndFormat: any }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
       text: "Ton lien de parrainage est l'outil principal pour construire ton empire et générer des revenus passifs.",
       button: "Détails"
    },
    {
       text: "Chaque inscription gratuite générée via ton lien privé augmente directement ton influence (+10 XP).",
       button: "Ensuite ?"
    },
    {
       text: `Dès qu'un de tes contacts accède au statut Premium, ${convertAndFormat(2500).formatted} sont crédités instantanément dans ta trésorerie.`,
       button: "Compris"
    }
  ];

  if (step >= steps.length) {
    return (
       <div className="bg-[#0a0a09] border border-[var(--color-border-gold)] hover:border-[var(--color-gold-main)]/50 rounded-[1.5rem] p-5 flex items-center justify-center cursor-pointer transition-all shadow-sm group" onClick={() => setStep(0)}>
          <div className="flex items-center gap-3">
             <Crown size={16} className="text-[var(--color-gold-main)] group-hover:scale-110 transition-transform" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-main)]">Revoir la stratégie de parrainage</p>
          </div>
       </div>
    );
  }

  return (
    <div className="bg-[#0a0a09] border border-[var(--color-border-gold)] rounded-[2rem] p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
       <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold-main)]/5 rounded-full blur-[40px] pointer-events-none" />
       
       <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#111] to-[#050505] flex items-center justify-center shrink-0 border border-[var(--color-gold-main)]/20 shadow-inner">
          <Crown className="text-[var(--color-gold-main)]" size={24} />
       </div>
       
       <div className="flex-1 w-full text-center sm:text-left relative z-10">
          <AnimatePresence mode="wait">
             <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:items-start items-center"
             >
                <p className="text-white/90 text-sm md:text-base leading-relaxed font-medium mb-4">
                   {steps[step].text}
                </p>
                <button 
                  onClick={() => setStep(s => s + 1)} 
                  className="px-6 py-2.5 bg-[var(--color-gold-main)]/10 hover:bg-[var(--color-gold-main)]/20 text-[var(--color-gold-main)] rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all border border-[var(--color-gold-main)]/20 active:scale-95"
                >
                   {steps[step].button}
                </button>
             </motion.div>
          </AnimatePresence>
       </div>
    </div>
  );
};

const AxisFirstTimeGuide = ({ onClose, convertAndFormat }: { onClose: () => void, convertAndFormat: any }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
       text: "Ton réseau est un actif générateur de revenus. Il est temps d'activer ta machine à revenus MZ+.",
       button: "Suivant"
    },
    {
       text: "À chaque fois qu'une personne s'inscrit gratuitement via ton lien privé, ton niveau d'expérience augmente (+10 XP).",
       button: "Et ensuite ?"
    },
    {
       text: `Dès qu'un de tes filleuls accède au statut Premium, tu reçois instantanément ${convertAndFormat(2500).formatted} sur ton solde, retirable immédiatement.`,
       button: "Accéder à mon lien"
    }
  ];

  const handleNext = () => {
    if (step >= steps.length - 1) {
      onClose();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-[#0a0a09] border border-[var(--color-border-gold)] rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
      >
         {/* Subtle gold glow */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold-main)]/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
         
         <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-[#111] to-[#050505] flex items-center justify-center mb-8 border border-[var(--color-gold-main)]/20 shadow-inner">
            <Crown className="text-[var(--color-gold-main)] opacity-90" size={26} />
         </div>
         
         <div className="relative z-10 min-h-[140px]">
            <AnimatePresence mode="wait">
               <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col"
               >
                  <h3 className="text-white/90 text-lg md:text-xl font-medium tracking-tight leading-relaxed mb-8">
                     {steps[step].text}
                  </h3>
               </motion.div>
            </AnimatePresence>
         </div>

         <div className="mt-4">
             <button 
               onClick={handleNext} 
               className="w-full py-4 bg-[var(--color-gold-main)] hover:bg-[var(--color-gold-light)] text-black rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2"
             >
                {steps[step].button}
                {step === steps.length - 1 ? <Rocket size={14} /> : <ChevronRight size={14} />}
             </button>
         </div>
         
         {/* Dots indicator */}
         <div className="flex justify-center gap-2 mt-6">
           {steps.map((_, i) => (
             <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-6 bg-[var(--color-gold-main)]' : 'w-1.5 bg-white/10'}`} />
           ))}
         </div>
      </motion.div>
    </div>
  );
};

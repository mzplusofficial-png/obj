
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Lock, 
  Crown, 
  Zap, 
  ShieldCheck, 
  Loader2, 
  Target,
  Rocket,
  ArrowRight,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Unlock,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import { useAxis } from '../axis/AxisProvider.tsx';
import { supabase } from '../../../services/supabase.ts';
import { UserProfile, Formation, TabId } from '../../../types.ts';
import { TextFormationReader } from './TextFormationReader.tsx';

interface AcademieMainProps {
  profile: UserProfile | null;
  onSwitchTab: (id: TabId) => void;
}

const PurpleText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span 
    className={`inline-block ${className}`}
    style={{ 
      background: 'linear-gradient(to right, #e879f9, #a855f7, #6366f1)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
    }}
  >
    {children}
  </span>
);

export const AcademieMain: React.FC<AcademieMainProps> = ({ profile, onSwitchTab }) => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTextFormation, setActiveTextFormation] = useState<Formation | null>(null);
  const isPremium = profile?.user_level === 'niveau_mz_plus';
  const isAdmin = profile?.is_admin === true || !!profile?.admin_role;

  const fetchFormations = async () => {
    const { data } = await supabase
      .from('mz_formations')
      .select('*')
      .order('order_index', { ascending: true });
    
    let finalData = data || [];
    
    // Inject default free text formation if not in DB
    const hasDefaultFree = finalData.some(f => f.id === 'default-free-text');
    const defaultInjections = [];
    if (!hasDefaultFree) {
       defaultInjections.push({
           id: 'default-free-text',
           title: 'Comment choisir son produit ?',
           description: 'La méthode pour trouver le produit parfait pour commencer en affiliation',
           thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
           preview_url: '',
           max_preview_seconds: 0,
           created_at: new Date().toISOString(),
           is_free: true,
           content_type: 'text',
           text_content: `Félicitations à toi.\n\nSi tu es arrivé jusqu’ici…\nc’est que tu veux vraiment passer à un autre niveau.\n\nMais écoute bien…\n\nLa volonté seule ne suffit pas.\n\nÀ un moment, il faut passer à l’action.\n\nEt ça tombe bien…\n\nParce qu’ici, tu es au bon endroit.\nLe bon business.\nLa bonne communauté.\n\nUne communauté qui ne te motive pas juste…\nmais qui te fait agir.\n\n👉 La MZ+.\n\nMaintenant, parlons d’affiliation.\n\nÉcoute bien…\n\nLa plupart des gens ne gagnent pas en affiliation…\npas parce qu’ils sont incapables.\n\nMais parce qu’ils choisissent des produits qui ne leur correspondent pas.\n\nIci, dans la MZ+, on ne fait pas ça.\n\nOn choisit un produit qui nous correspond.\n\nUn produit que tu comprends.\nUn produit dont tu peux parler facilement.\nUn produit qui résout un vrai problème.\n\nParce que la vérité est simple :\n\n👉 Si tu ne comprends pas ce que tu vends… personne n’achète.\n\nDonc avant d’ajouter n’importe quel produit dans ta boutique…\n\nPrends le temps de regarder les détails.\nDe vraiment le comprendre.\n\nEt pose-toi cette question :\n\n“Est-ce que je peux recommander ce produit à quelqu’un de proche ?”\n\nSi la réponse est non…\n\nLaisse tomber.\n\nEt retiens bien ça :\n\nTu n’as pas besoin du produit parfait.\n\nTu as besoin d’un produit simple…\npour faire ta première vente.\n\nParce qu’ici…\n\nOn commence petit.\n\nMais on joue pour devenir grand.\n\nEt le jour où tu fais ta première vente…\n\nTout change.\n\nParce que tu comprends enfin le principe.\n\nImagine que tu vende\n\nUn produit qui te génère 2500 de comission …  10 fois en une semaine.\n\nC’est ça, le pouvoir.`
       });
    }

    const hasDefaultFreeVideo = finalData.some(f => f.id === 'default-free-video');
    if (!hasDefaultFreeVideo) {
      defaultInjections.push({
           id: 'default-free-video',
           title: 'La méthode en vidéo',
           description: 'Lancer son premier business avec les bonnes bases',
           thumbnail_url: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=2070&auto=format&fit=crop',
           preview_url: 'https://www.youtube.com/watch?v=TaKS_28uuWg',
           max_preview_seconds: 0,
           created_at: new Date().toISOString(),
           is_free: true,
           content_type: 'video'
      });
    }

    finalData = [...defaultInjections, ...finalData];
    setFormations(finalData);
    setLoading(false);
  };

  useEffect(() => {
    fetchFormations();
    const channel = supabase.channel('formations_realtime_elite_v5')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mz_formations' }, fetchFormations)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const handleOpenFormation = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      const formationId = customEvent.detail.id;
      const formation = formations.find(f => f.id === formationId);
      if (formation) {
        setActiveTextFormation(formation);
      }
    };
    window.addEventListener('open-formation', handleOpenFormation);
    return () => {
      window.removeEventListener('open-formation', handleOpenFormation);
    };
  }, [formations]);

  const handleReadTextFormation = (formation: Formation) => {
     setActiveTextFormation(formation);
  };

  if (loading) return (
    <div className="py-40 flex flex-col items-center gap-8">
      <div className="relative">
        <div className="w-20 h-20 border-[1px] border-purple-500/20 rounded-full animate-ping absolute"></div>
        <Loader2 className="animate-spin text-purple-500" size={40} strokeWidth={1} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-neutral-600 animate-pulse">Initialisation de l'expertise...</p>
    </div>
  );

  const freeFormations = formations.filter(f => f.is_free);
  const premiumFormations = formations.filter(f => !f.is_free);

  return (
    <div className="animate-fade-in pb-40 px-4 md:px-0 max-w-5xl mx-auto">
      
      {/* 1. HEADER ÉPURÉ & STATUT UNIQUE */}
      <div className="text-center mb-24 space-y-8">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-500">Masterclass Élite</span>
           </div>
           <h2 className="text-4xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85]">
             ACADÉMIE <br/><PurpleText>STRATÉGIQUE</PurpleText>
           </h2>
        </div>

        {/* BANDEAU DE STATUT PREMIUM - LE SEUL CTA GLOBAL */}
        {!isPremium && (
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-purple-900/40 via-purple-600/20 to-purple-900/40 border border-purple-500/30 p-6 rounded-[2rem] backdrop-blur-xl animate-slide-down flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
             <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                   <Lock size={20} strokeWidth={2.5} />
                </div>
                <div>
                   <p className="text-white text-xs font-black uppercase tracking-tight">Accès Complet Verrouillé</p>
                   <p className="text-purple-300/60 text-[10px] font-medium leading-tight">Débloquez l'intégralité des modules de l'Académie en passant au Niveau MZ+ Premium.</p>
                </div>
             </div>
             <button 
               onClick={() => onSwitchTab('flash_offer')}
               className="px-6 py-3.5 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl whitespace-nowrap"
             >
               Activer mon accès
             </button>
          </div>
        )}
      </div>

      {/* 2. LISTE DES MODULES - GRATUITS */}
      {freeFormations.length > 0 && (
        <div className="mb-32">
          <div className="flex items-center gap-4 mb-16 border-b border-emerald-500/20 pb-4">
            <Unlock className="text-emerald-500" size={24} />
            <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">Formations <span className="text-emerald-500">Gratuites</span></h3>
          </div>
          <div className="space-y-48">
            {freeFormations.map((f, index) => (
              <EliteModuleCard 
                key={f.id} 
                formation={f} 
                index={index + 1}
                isPremium={isPremium} 
                isFree={true}
                onUpgrade={() => onSwitchTab('flash_offer')} 
                onReadClick={() => handleReadTextFormation(f)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. LISTE DES MODULES - PREMIUM */}
      <div>
        <div className="flex items-center gap-4 mb-16 border-b border-purple-500/20 pb-4">
          <Crown className="text-purple-500" size={24} />
          <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">Formations <PurpleText>Premium</PurpleText></h3>
        </div>
        <div className="space-y-48">
          {premiumFormations.length === 0 ? (
            <div className="py-20 text-center opacity-20 italic uppercase tracking-[0.5em] text-xs font-black">Aucun module premium disponible...</div>
          ) : (
            premiumFormations.map((f, index) => (
              <EliteModuleCard 
                key={f.id} 
                formation={f} 
                index={freeFormations.length + index + 1}
                isPremium={isPremium} 
                isFree={false}
                onUpgrade={() => onSwitchTab('flash_offer')} 
                onReadClick={() => handleReadTextFormation(f)}
              />
            ))
          )}
        </div>
      </div>

      {/* FOOTER RAFFINÉ */}
      <div className="mt-40 pt-20 border-t border-white/5 text-center opacity-20">
         <ShieldCheck size={32} className="mx-auto mb-4 text-purple-500" />
         <p className="text-[8px] font-black uppercase tracking-[0.5em]">Certification Millionaire Zone Plus • Tous droits réservés</p>
      </div>
      
      {activeTextFormation && (
        <TextFormationReader 
           title={activeTextFormation.title}
           content={activeTextFormation.text_content || ''}
           formationId={activeTextFormation.id}
           isAdmin={isAdmin}
           onClose={() => setActiveTextFormation(null)}
           onComplete={() => setActiveTextFormation(null)}
        />
      )}
    </div>
  );
};

const EliteModuleCard: React.FC<{ formation: Formation; index: number; isPremium: boolean; isFree?: boolean; onUpgrade: () => void; onReadClick?: () => void }> = ({ formation, index, isPremium, isFree = false, onUpgrade, onReadClick }) => {
  const { axisState, hideAxis } = useAxis();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isHighlighted = formation.id === 'default-free-text' && axisState === 'progression';

  const hasVideo = Boolean(formation.preview_url);

  const isYouTube = hasVideo && (formation.preview_url.includes('youtube.com') || formation.preview_url.includes('youtu.be'));
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const youtubeId = isYouTube ? getYouTubeId(formation.preview_url) : null;

  const getChapters = () => {
    if (formation.chapters && formation.chapters.length > 0) {
      const icons = [Target, Sparkles, TrendingUp, DollarSign, Rocket, Zap, ShieldCheck];
      return formation.chapters.map((ch, idx) => ({
        title: ch.title,
        icon: icons[idx % icons.length]
      }));
    }
    return [
      { title: "🎬 Chapitre 1 : Introduction & Concept", icon: Target },
      { title: "🚀 Chapitre 2 : Mise en place stratégique", icon: Sparkles },
      { title: "💰 Chapitre 3 : Optimisation des revenus", icon: DollarSign }
    ];
  };

  const chapters = getChapters();

  const handlePlay = () => {
    if (isHighlighted) hideAxis();
    if (showPaywall) return;
    if (formation.content_type === 'text' && onReadClick) {
      if (!isPremium && !isFree) {
        setShowPaywall(true);
      } else {
        onReadClick();
      }
      return;
    }
    if (!hasVideo && !isPremium && !isFree) {
      setShowPaywall(true);
      return;
    }
    if (hasVideo) {
      setIsPlaying(true);
      videoRef.current?.play();
    }
  };

  const handleVideoEnded = () => {
    if (!isPremium && !isFree) {
      setShowPaywall(true);
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
    }
  };

  const isTextBased = formation.content_type === 'text';

  return (
    <div className="space-y-12 animate-fade-in group">
      
      {/* 1. TITRE DU MODULE - Épuré */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
         <div className="space-y-2">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500/80">Module 0{index}</span>
               {index === 1 && !isFree && <span className="px-2 py-0.5 bg-yellow-600/10 border border-yellow-600/30 text-yellow-600 rounded-md text-[7px] font-black uppercase tracking-widest flex items-center gap-1"><Zap size={8}/> Fondamentaux</span>}
               {isTextBased && <span className="px-2 py-0.5 bg-blue-600/10 border border-blue-600/30 text-blue-500 rounded-md text-[7px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={8}/> Format Texte</span>}
            </div>
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
              {formation.title}
            </h3>
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 md:mb-1">
           {isPremium || isFree ? "Accès Membre • Débloqué" : "Statut MZ+ • Privé"}
         </p>
      </div>

      {/* 2. MINIATURE - Focus Image, pas de bouton externe */}
      <div className="relative max-w-5xl mx-auto">
        {isHighlighted && (
           <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-50">
             <span className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-1 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-900/50 backdrop-blur-md">Clique ici</span>
             <ArrowDown className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" size={20} />
           </div>
        )}
        <div className={`relative aspect-video rounded-[3rem] overflow-hidden border bg-[#050505] shadow-[0_50px_100px_rgba(0,0,0,0.8)] transition-all duration-1000 group-hover:border-purple-600/20 ${isHighlighted ? 'border-emerald-500 ring-4 ring-[#10b981]/30 shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-pulse mz-highlighted-btn' : 'border-white/10'}`}>
          
          {!isPlaying && !showPaywall && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer group/overlay" onClick={handlePlay}>
              <img 
                src={formation.thumbnail_url} 
                className="absolute inset-0 w-full h-full object-cover opacity-100 transition-all duration-1000 group-hover/overlay:scale-[1.03]" 
                alt={formation.title}
              />
              
              <div className="absolute inset-0 bg-black/10 group-hover/overlay:bg-black/30 transition-colors pointer-events-none"></div>
              
              {/* Badge d'exclusivité raffiné */}
              {!isPremium && !isFree && (
                <div className="absolute top-8 right-8 px-5 py-2 bg-black/60 backdrop-blur-xl border border-white/10 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest shadow-2xl z-20 flex items-center gap-2">
                   <Lock size={12} className="text-purple-500" /> RÉSERVÉ MZ+ PREMIUM
                </div>
              )}
              {isFree && !isPremium && (
                <div className="absolute top-8 right-8 px-5 py-2 bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 text-emerald-400 rounded-2xl text-[8px] font-black uppercase tracking-widest shadow-2xl z-20 flex items-center gap-2">
                   <Unlock size={12} /> ACCÈS LIBRE
                </div>
              )}

              {/* Bouton de lecture minimaliste */}
              <div className="relative z-10">
                 {isTextBased ? (
                    <div className="px-8 py-4 rounded-full border border-white/20 flex items-center justify-center gap-3 transition-all duration-500 shadow-2xl font-black tracking-widest uppercase text-xs text-white bg-black/40 backdrop-blur-md group-hover/overlay:bg-emerald-600 group-hover/overlay:border-emerald-400 group-hover/overlay:scale-105">
                       Lire Maintenant <ArrowUpRight size={16} />
                    </div>
                 ) : (
                    <div className={`w-24 h-24 rounded-full border border-white/20 flex items-center justify-center transition-all duration-500 shadow-2xl relative text-white bg-black/40 backdrop-blur-md group-hover/overlay:bg-purple-600 group-hover/overlay:border-purple-400 group-hover/overlay:scale-110`}>
                       {hasVideo ? <Play size={32} fill="currentColor" className="ml-1.5" /> : <Lock size={32} strokeWidth={2.5} />}
                    </div>
                 )}
              </div>
            </div>
          )}

          {hasVideo && !isTextBased && !isYouTube && (
            <video 
              ref={videoRef}
              src={formation.preview_url}
              className={`w-full h-full object-cover ${showPaywall ? 'blur-3xl grayscale scale-110' : ''} transition-all duration-1000`}
              onEnded={handleVideoEnded}
              controls={isPlaying && !showPaywall}
              playsInline
            />
          )}

          {hasVideo && !isTextBased && isYouTube && isPlaying && !showPaywall && (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title={formation.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className={`w-full h-full absolute inset-0 z-10 border-0 ${showPaywall ? 'blur-3xl grayscale scale-110' : ''} transition-all duration-1000`}
            />
          )}

          {/* PAYWALL INTÉGRÉ - Uniquement si clic Standard */}
          {showPaywall && (
            <div className="absolute inset-0 z-20 bg-black/95 backdrop-blur-[100px] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-20 h-20 bg-purple-600/20 border border-purple-600/40 rounded-[2rem] flex items-center justify-center text-purple-400 mb-8 shadow-2xl animate-bounce">
                 <Lock size={36} strokeWidth={2.5} />
              </div>
              <div className="space-y-4 mb-10">
                 <h5 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter italic">
                   CONTENU <PurpleText>RÉSERVÉ</PurpleText>
                 </h5>
                 <p className="text-neutral-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">
                   Devenez membre MZ+ Premium pour débloquer l'intégralité de notre savoir stratégique.
                 </p>
              </div>
              <button 
                onClick={onUpgrade}
                className="group px-12 py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-2xl flex items-center gap-3 active:scale-95"
              >
                Débloquer tout le système <ArrowRight size={18} strokeWidth={3} />
              </button>
              <button onClick={() => setShowPaywall(false)} className="mt-8 text-neutral-600 text-[8px] font-black uppercase tracking-widest hover:text-white transition-colors">Plus tard</button>
            </div>
          )}
        </div>
      </div>

      {/* 3. PLAN D'ACTION (CHAPITRES) - Épuré et informatif */}
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="flex items-center gap-3 pl-4 border-l-2 border-purple-600/30">
           <Eye size={12} className="text-purple-500" />
           <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em] italic">
             Aperçu du programme stratégique
           </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
           {chapters.map((chap, i) => (
             <div key={i} className="flex items-center gap-6 p-5 bg-white/[0.01] border border-white/5 rounded-3xl hover:bg-white/[0.03] transition-all">
                <div className="w-10 h-10 rounded-xl bg-neutral-950 flex items-center justify-center text-neutral-700 transition-all shadow-inner shrink-0 group-hover:text-purple-400">
                   <chap.icon size={18} />
                </div>
                <h4 className="text-[10px] md:text-[12px] font-black uppercase text-neutral-500 tracking-widest leading-tight">
                   {chap.title}
                </h4>
                {(!isPremium && !isFree) && <Lock size={12} className="ml-auto text-neutral-800" />}
                {(isPremium || isFree) && <CheckCircle2 size={16} className={`ml-auto ${isFree && !isPremium ? 'text-emerald-500/50' : 'text-purple-600/50'}`} />}
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

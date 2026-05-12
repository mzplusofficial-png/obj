
import React, { useState, useEffect, useCallback } from 'react';
import { Loader, Sparkles, X, AlertTriangle, Bell, Crown, Rocket } from 'lucide-react';
import { supabase } from './services/supabase.ts';
import { UserProfile, Wallet, TabId, Product } from './types.ts';
import { LandingPage } from './components/LandingPage.tsx';
import { DashboardLayout } from './components/DashboardLayout.tsx';
import { 
  GlobalView, 
  RevenueTab, 
  TeamTab, 
  RPADashboard, 
  CoachingTab, 
  FormationTab, 
  UpgradeTab, 
  SuggestionsTab,
  GuidesTab,
  ProfileTab
} from './components/DashboardTabs.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { RankRewardChecker } from './components/features/rank-rewards/RankRewardChecker.tsx';
import { MyStore } from './components/features/my-store/MyStore.tsx';
import { StandalonePublicStore } from './components/features/my-store/StandalonePublicStore.tsx';
import { RewardFeature } from './components/features/programme-recompense/RewardFeature.tsx';
import { PWAInstallBanner } from './components/ui/PWAInstallBanner.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { ProductSalesPage } from './components/ProductSalesPage.tsx';
import { EspacePrive } from './components/EspacePrive.tsx';
import { MZPlusFlashOfferOverlay } from './components/features/mz-plus-offer/MZPlusFlashOfferOverlay.tsx';
import { MZPlusPresentationOverlay } from './components/features/mz-plus-presentation/MZPlusPresentationOverlay.tsx';
import { LiveWithdrawalsView } from './components/features/withdrawals/LiveWithdrawalsView.tsx';
import { LeaderboardTab } from './components/features/leaderboard/LeaderboardTab.tsx';
import { LunaChatPage } from './components/LunaChatPage.tsx';
import { SQLConsole } from './components/SQLConsole.tsx';
import { PrivateMessagingMain } from './components/features/messagerie-privee/PrivateMessagingMain.tsx';
import { PushDisplay } from './components/features/admin-push-notifications/PushDisplay.tsx';
import { AnnouncementOverlay } from './components/features/marketing-announcements/AnnouncementOverlay.tsx';
import { AffiliationGuide } from './components/guides/AffiliationGuide.tsx';
import { RPAGuide } from './components/guides/RPAGuide.tsx';
import { TeamGuide } from './components/guides/TeamGuide.tsx';
import { PremiumPopup } from './components/PremiumPopup.tsx';
import { PremiumAccessGate } from './components/premium-access/PremiumAccessGate.tsx';
import { requestNotificationPermission, onMessageListener } from './services/firebase.ts';
import { useAxis } from './components/features/axis/AxisProvider.tsx';
import { AxisGuideFlow } from './components/features/axis/AxisGuideFlow.tsx';
import { AxisChat } from './components/features/axis/AxisChat.tsx';
import { XPRewardModal } from './components/features/gamification/XPRewardModal.tsx';
import { ShareModal } from './components/features/gamification/ShareModal.tsx';
import { ChallengePresentation } from './components/features/challenges/ChallengePresentation.tsx';
import { WeeklyChallenge } from './components/features/challenges/WeeklyChallenge.tsx';
import { rewardUserXP } from './services/gamification.ts';
import { PROGRESSION_LEVELS } from './components/features/progression/LiquidProgressionTube.tsx';

import { TextFormationReader } from './components/features/formation/TextFormationReader.tsx';
import { BONUS_CONTENTS } from './components/features/formation/bonusContentData.ts';

const ADMIN_EMAILS = [
  'equipemzplus@gmail.com',
  'millionairezoneplus@gmail.com',
  'admin@mz.plus'
];

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProductChecked, setIsProductChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [activeCategory, setActiveCategory] = useState<string>('main');
  const [lastUpdateSignal, setLastUpdateSignal] = useState<number>(Date.now());
  const [customerProduct, setCustomerProduct] = useState<Product | null>(null);
  const [storeOwnerCode, setStoreOwnerCode] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<'view' | 'processing' | 'success'>('view');
  const [isGuideActive, setIsGuideActive] = useState(false);
  const [isRPAGuideActive, setIsRPAGuideActive] = useState(false);
  const [isTeamGuideActive, setIsTeamGuideActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ title: string; body: string; type?: 'info' | 'error' | 'warning' } | null>(null);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [initSequence, setInitSequence] = useState(true);
  const [showXpReward, setShowXpReward] = useState(false);
  const [xpRewardAmount, setXpRewardAmount] = useState(0);
  const [xpRewardTitle, setXpRewardTitle] = useState("");
  const [xpRewardDesc, setXpRewardDesc] = useState("");
  const [xpRewardSource, setXpRewardSource] = useState("");
  const [showSharePopup, setShowSharePopup] = useState(false);
  
  // Défis "3 Jours" Trigger States

  const [showChallenge, setShowChallenge] = useState(false);
  const [showChallengeDay2, setShowChallengeDay2] = useState(false);
  const [showChallengeDay3, setShowChallengeDay3] = useState(false);
  const [showChallengeDay2Fail, setShowChallengeDay2Fail] = useState(false);
  const [pendingDay3TriggerAfterPremium, setPendingDay3TriggerAfterPremium] = useState(false);
  const [forceDay3FailText, setForceDay3FailText] = useState(false);
  const [challengeEligible, setChallengeEligible] = useState(false);
  const [challengeTriggered, setChallengeTriggered] = useState(false);
  const [showChallengeCelebration, setShowChallengeCelebration] = useState(false);
  const [challengeCelebratedStep, setChallengeCelebratedStep] = useState(1);
  const [showDay2UpsellPopup, setShowDay2UpsellPopup] = useState(false);
  const [showDay2FailedUpsellPopup, setShowDay2FailedUpsellPopup] = useState(false);
  const [bonusContent, setBonusContent] = useState<{ id: string; title: string; content: string } | null>(null);
  
  const { triggerAxisMessage, hideAxis, setIsChatOpen, setChatUnlocked } = useAxis();

  useEffect(() => {
    if (!userProfile || loading) return;
    const chatIntroduced = localStorage.getItem('mz_axis_chat_introduced') === 'true';
    if (chatIntroduced) return;

    const checkUnlock = () => {
      const challengeState = userProfile.store_preferences?.challenge_3j || {};
      const day1Done = challengeState.j1Completed === true;
      
      const sessionStart = localStorage.getItem('mz_first_visit_time') || Date.now().toString();
      if (!localStorage.getItem('mz_first_visit_time')) {
        localStorage.setItem('mz_first_visit_time', sessionStart);
      }
      
      const fiveMinutesPassed = (Date.now() - parseInt(sessionStart)) > 5 * 60 * 1000;

      if (day1Done || fiveMinutesPassed) {
        setTimeout(() => {
          triggerAxisMessage(
            "Tu es maintenant un vrai Elite… 👁️\nTu peux désormais discuter avec moi en direct à tout moment. Je serai toujours là pour t'épauler dans ton ascension.",
            "success",
            15000,
            {
              label: "Essayer le chat",
              action: () => setIsChatOpen(true)
            }
          );
          localStorage.setItem('mz_axis_chat_introduced', 'true');
          setChatUnlocked(true);
        }, 2000);
        return true;
      }
      return false;
    };

    // Initial check
    if (checkUnlock()) return;

    // Background timer to check every 30 seconds
    const interval = setInterval(() => {
      if (checkUnlock()) {
        clearInterval(interval);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [userProfile, loading, triggerAxisMessage, setIsChatOpen, setChatUnlocked]);

  useEffect(() => {
    const handlePlaySound = async (e: Event) => {
      const customEvent = e as CustomEvent<{ sound: string }>;
      const soundCategory = customEvent.detail?.sound;
      if (!soundCategory) return;

      try {
        const { data, error } = await supabase
          .from('mz_sound_effects')
          .select('url')
          .eq('category', soundCategory)
          .single();
        
        if (error) {
          console.warn(`Could not find sound for category: ${soundCategory}`, error);
          return;
        }

        if (data?.url) {
          const audio = new Audio(data.url);
          audio.play().catch(err => console.warn("Audio play blocked", err));
        }
      } catch (err) {
        console.error("Sound play error:", err);
      }
    };
    window.addEventListener('mz-play-sound', handlePlaySound);
    return () => window.removeEventListener('mz-play-sound', handlePlaySound);
  }, []);

  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
        if (e.detail === 'axis') setIsChatOpen(true);
        else setIsChatOpen(false);
      }
    };
    window.addEventListener('switch-tab', handleSwitchTab);
    return () => window.removeEventListener('switch-tab', handleSwitchTab);
  }, [setIsChatOpen]);

  useEffect(() => {
    if (activeTab === 'dashboard' && pendingDay3TriggerAfterPremium) {
      setPendingDay3TriggerAfterPremium(false);
      updateChallengeDB({ j3Presented: true, j3StartedAt: new Date().toISOString() });
      setForceDay3FailText(true);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('mz-trigger-3j-day3'));
      }, 800);
    }
  }, [activeTab, pendingDay3TriggerAfterPremium]);

  // DB-Backed Challenge Update Helper
  const updateChallengeDB = async (updates: any) => {
    if (!userProfile) return;
    const currentState = userProfile.store_preferences?.challenge_3j || {};
    const newState = { ...currentState, ...updates };
    const newPrefs = { ...(userProfile.store_preferences || {}), challenge_3j: newState };
    
    // Optimistic UI Update
    setUserProfile((prev: any) => prev ? { ...prev, store_preferences: newPrefs } : prev);
    // Push DB
    try {
      await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userProfile.id);
      
      const dbPayload = {
        user_id: userProfile.id,
        presented: newState.presented || false,
        started_at: newState.startedAt || null,
        j1_completed: newState.j1Completed || false,
        j2_presented: newState.j2Presented || false,
        j2_started_at: newState.j2StartedAt || null,
        j2_completed: newState.j2Completed || false,
        j2_completed_at: newState.j2CompletedAtStr || null,
        j3_presented: newState.j3Presented || false,
        j3_started_at: newState.j3StartedAt || null,
        j3_completed: newState.j3Completed || false,
        cancelled: newState.cancelled || false,
        updated_at: new Date().toISOString()
      };
      await supabase.from('mz_challenge_3j_state').upsert(dbPayload, { onConflict: 'user_id' });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Challenge Progression / Completion (J1 & J2)
  useEffect(() => {
    if (!userProfile) return;

    const challengeState = userProfile.store_preferences?.challenge_3j || {};
    
    const checkDailyChallenge = () => {
      if (!challengeState.presented || challengeState.cancelled) return;

      // Check for Day 2 eligibility
      if (challengeState.startedAt && challengeState.j1Completed) {
        const startedAtDate = new Date(challengeState.startedAt);
        const currentDate = new Date();
        const startDayLocal = startedAtDate.getFullYear() + '-' + String(startedAtDate.getMonth() + 1).padStart(2, '0') + '-' + String(startedAtDate.getDate()).padStart(2, '0');
        const currentDayLocal = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');

        if (currentDayLocal > startDayLocal) {
          if (!challengeState.j2Presented && !challengeState.j2Completed) {
            setShowChallengeDay2(true);
          }
        }
      }
      
      // Check for Day 2 Failure (Presented but not completed the next day)
      if (challengeState.j2StartedAt && !challengeState.j2Completed) {
        const j2StartedDate = new Date(challengeState.j2StartedAt);
        const currentDate = new Date();
        const j2StartLocal = j2StartedDate.getFullYear() + '-' + String(j2StartedDate.getMonth() + 1).padStart(2, '0') + '-' + String(j2StartedDate.getDate()).padStart(2, '0');
        const currentDayLocal = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');

        if (currentDayLocal > j2StartLocal) {
           if (!challengeState.j3Presented) {
               setTimeout(() => setShowChallengeDay2Fail(true), 1500);
           }
        }
      }

      if (challengeState.j2CompletedAtStr) {
        const j2CompDate = new Date(challengeState.j2CompletedAtStr);
        const currentDate = new Date();
        const j2CompLocal = j2CompDate.getFullYear() + '-' + String(j2CompDate.getMonth() + 1).padStart(2, '0') + '-' + String(j2CompDate.getDate()).padStart(2, '0');
        const currentDayLocal = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
        
        if (currentDayLocal > j2CompLocal) {
          if (!challengeState.j3Presented && !challengeState.j3Completed) {
              window.dispatchEvent(new CustomEvent('mz-trigger-3j-day3'));
          }
        }
      }
    };

    checkDailyChallenge();
    const interval = setInterval(checkDailyChallenge, 60000);
    return () => clearInterval(interval);
  }, [userProfile]); // Runs when userProfile (and nested challengeState) changes

  useEffect(() => {
    const handleProductAdded = () => {
      const challengeState = userProfile?.store_preferences?.challenge_3j || {};
      
      if (!challengeState.presented || challengeState.cancelled) return;
      
      const updates: any = {};
      
      // Register the start time if not present
      if (!challengeState.startedAt) {
         updates.startedAt = new Date().toISOString();
      }
      
      if (!challengeState.j1Completed) {
        updates.j1Completed = true;
        setChallengeCelebratedStep(1);
        setTimeout(() => {
          setShowChallengeCelebration(true);
        }, 800);
      }
      
      if (Object.keys(updates).length > 0) {
        updateChallengeDB(updates);
      }
    };
    
    const handleNewSale = () => {
       const challengeState = userProfile?.store_preferences?.challenge_3j || {};
       if (challengeState.cancelled) return;
       const updates: any = {};
       
       if (challengeState.j2Presented && !challengeState.j2Completed) {
          updates.j2Completed = true;
          updates.j2CompletedAtStr = new Date().toISOString();
          setChallengeCelebratedStep(2);
          setTimeout(() => {
            setShowChallengeCelebration(true);
          }, 800);
       } else if (challengeState.j3Presented && !challengeState.j3Completed) {
          updates.j3Completed = true;
          setChallengeCelebratedStep(3);
          setTimeout(() => {
            setShowChallengeCelebration(true);
          }, 800);
       }
       
       if (Object.keys(updates).length > 0) {
          updateChallengeDB(updates);
       }
    };

    const handleDay2FormationRead = () => {
       if (userProfile?.user_level === 'niveau_mz_plus') return;
       if (localStorage.getItem('mz_premium_cta_clicked')) return;
       if (localStorage.getItem('mz_day2_premium_upsell_shown')) return;

       localStorage.setItem('mz_day2_premium_upsell_shown', 'true');
       
       setTimeout(() => {
          setShowDay2UpsellPopup(true);
       }, 500);
    };

    const handleResetChallenge = () => {
       if (!userProfile) return;
       const newPrefs = { ...(userProfile.store_preferences || {}), challenge_3j: {} };
       setUserProfile((prev: any) => prev ? { ...prev, store_preferences: newPrefs } : prev);
       supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userProfile.id).then();
    };

    const handleTestDay2Fail = () => {
      setShowChallengeDay2Fail(true);
    };

    window.addEventListener('mz-product-added-to-store', handleProductAdded);
    window.addEventListener('mz-new-sale', handleNewSale);
    window.addEventListener('mz-day2-formation-read', handleDay2FormationRead);
    window.addEventListener('mz-reset-challenge', handleResetChallenge);
    window.addEventListener('mz-test-day2-fail', handleTestDay2Fail);
    
    return () => {
       window.removeEventListener('mz-product-added-to-store', handleProductAdded);
       window.removeEventListener('mz-new-sale', handleNewSale);
       window.removeEventListener('mz-day2-formation-read', handleDay2FormationRead);
       window.removeEventListener('mz-reset-challenge', handleResetChallenge);
       window.removeEventListener('mz-test-day2-fail', handleTestDay2Fail);
    };
  }, [userProfile]); // Add dependency on userProfile so the DB helpers get latest state!

  useEffect(() => {
    const handleXpReward = async (e: Event) => {
      const customEvent = e as CustomEvent<{amount: number, title?: string, description?: string, source?: string}>;
      setXpRewardAmount(customEvent.detail.amount);
      if (customEvent.detail.title) setXpRewardTitle(customEvent.detail.title);
      if (customEvent.detail.description) setXpRewardDesc(customEvent.detail.description);
      if (customEvent.detail.source) setXpRewardSource(customEvent.detail.source);
      else setXpRewardSource("");
      setShowXpReward(true);
      
      if (session?.user?.id) {
        await rewardUserXP(session.user.id, customEvent.detail.amount);
        triggerRefresh();
      }
    };
    
    window.addEventListener('mz-xp-reward', handleXpReward);
    return () => window.removeEventListener('mz-xp-reward', handleXpReward);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setInitSequence(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Challenge Trigger Effect
  useEffect(() => {
    if (challengeEligible && !challengeTriggered) {
      let activeSeconds = 0;
      const isAdminTest = userProfile?.email === 'mzplusofficial@gmail.com' || userProfile?.email === 'maximilienleroy01@gmail.com' || userProfile?.email === 'h.bocquet.pro@gmail.com';
      const waitTarget = isAdminTest ? 2 : 15;
      
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          activeSeconds += 1;
          if (activeSeconds >= waitTarget) {
            clearInterval(interval);
            setChallengeTriggered(true);
            setShowChallenge(true);
            const prefs = userProfile?.store_preferences || {};
            const challenge = prefs.challenge_3j || {};
            if (!challenge.presented && userProfile) {
              const newPrefs = { ...prefs, challenge_3j: { ...challenge, presented: true } };
              setUserProfile((prev: any) => prev ? { ...prev, store_preferences: newPrefs } : prev);
              supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userProfile.id).then();
            }
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [challengeEligible, challengeTriggered, userProfile?.email]);

  useEffect(() => {
    const handleAxisMessage = (e: Event) => {
      const customEvent = e as CustomEvent<{text: string; type?: 'progression' | 'warning' | 'success'; duration?: number; action?: {label: string, onClick: () => void}}>;
      triggerAxisMessage(
        customEvent.detail.text, 
        customEvent.detail.type || 'progression', 
        customEvent.detail.duration || 10000, 
        customEvent.detail.action,
        'smart'
      );
    };
    window.addEventListener('mz-axis-message', handleAxisMessage);
    return () => window.removeEventListener('mz-axis-message', handleAxisMessage);
  }, [triggerAxisMessage]);

  useEffect(() => {
    if (!userProfile?.id) return;
    
    // Écoute les modifications admin en temps réel
    const channel = supabase.channel('mz_admin_challenge_controls_' + userProfile.id)
      .on('broadcast', { event: 'force_update' }, (payload: any) => {
        const { userId, challengeData, action } = payload.payload;
        if (userId === userProfile.id) {
          console.log("[Admin Force Update] Received:", payload.payload);
          
          setUserProfile((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              store_preferences: {
                ...(prev.store_preferences || {}),
                challenge_3j: challengeData
              }
            };
          });
          
          // Sauvegarde en DB pour la persistance 
          supabase.from('users').select('store_preferences').eq('id', userId).single().then(({data}) => {
            const prefs = data?.store_preferences || {};
            const newPrefs = { ...prefs, challenge_3j: challengeData };
            supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userId).then();
          });
          
          window.dispatchEvent(new CustomEvent('mz-axis-message', { 
            detail: { text: `⚠️ Votre état de défi a été modifié (${action})`, type: 'warning', duration: 5000 } 
          }));
          
          // Re-evaluation instantanée des modales
          if (action === 'reset') {
            setShowChallenge(false);
            setShowChallengeDay2(false);
            setShowChallengeDay3(false);
            setShowChallengeDay2Fail(false);
            setShowChallengeCelebration(false);
          } else if (action === 'set_j1') {
            setShowChallenge(true);
            setShowChallengeDay2(false);
            setShowChallengeDay3(false);
            setShowChallengeDay2Fail(false);
            setShowChallengeCelebration(false);
          } else if (action === 'set_j2') {
            setShowChallenge(false);
            setShowChallengeDay2(true);
            setShowChallengeDay3(false);
            setShowChallengeDay2Fail(false);
            setShowChallengeCelebration(false);
          } else if (action === 'set_j2_failed') {
            setShowChallenge(false);
            setShowChallengeDay2(false);
            setShowChallengeDay3(false);
            setShowChallengeDay2Fail(true);
            setShowChallengeCelebration(false);
          } else if (action === 'set_j3') {
            setShowChallenge(false);
            setShowChallengeDay2(false);
            setShowChallengeDay3(true);
            setShowChallengeDay2Fail(false);
            setShowChallengeCelebration(false);
          }
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  useEffect(() => {
    const handleForceChallenge = () => {
      setShowChallenge(true);
      if (userProfile && !userProfile.store_preferences?.challenge_3j?.presented) {
         const prefs = userProfile.store_preferences || {};
         const challenge = prefs.challenge_3j || {};
         const newPrefs = { ...prefs, challenge_3j: { ...challenge, presented: true } };
         setUserProfile((prev: any) => prev ? { ...prev, store_preferences: newPrefs } : prev);
         supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userProfile.id).then();
      }
    };
    const handleForceGuide = () => {
      setChallengeTriggered(false);
      setChallengeEligible(false);
    };
    const handleForceCelebration = () => {
      setChallengeCelebratedStep(1);
      setShowChallengeCelebration(true);
    };
    const handleForceDay2 = () => {
      setShowChallengeDay2(true);
    };
    const handleForceDay3 = () => {
      setShowChallengeDay3(true);
    };
    window.addEventListener('mz-trigger-3j-challenge', handleForceChallenge);
    window.addEventListener('mz-force-welcome-guide', handleForceGuide);
    window.addEventListener('mz-trigger-3j-celebration', handleForceCelebration);
    window.addEventListener('mz-trigger-3j-day2', handleForceDay2);
    window.addEventListener('mz-trigger-3j-day3', handleForceDay3);
    return () => {
      window.removeEventListener('mz-trigger-3j-challenge', handleForceChallenge);
      window.removeEventListener('mz-force-welcome-guide', handleForceGuide);
      window.removeEventListener('mz-trigger-3j-celebration', handleForceCelebration);
      window.removeEventListener('mz-trigger-3j-day2', handleForceDay2);
      window.removeEventListener('mz-trigger-3j-day3', handleForceDay3);
    };
  }, []);

  useEffect(() => {
    const handleNavigateDashboard = () => {
      setActiveTab('dashboard');
    };
    window.addEventListener('mz-navigate-dashboard', handleNavigateDashboard);
    return () => window.removeEventListener('mz-navigate-dashboard', handleNavigateDashboard);
  }, []);

  const setupFCM = async (isManual = false) => {
    // ESSENTIEL : Récupérer la clé VAPID depuis l'environnement
    // L'utilisateur DOIT configurer VITE_FIREBASE_VAPID_KEY dans les settings.
    const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BAwxNENrQumeZKV97HVoBkQvB8b4USCMBRVACIVBtLGDSYWll-6F_8wFwN6dhpcbMdh-tNwmdGKWa7FuRjbzCtg";
    
    if (!VAPID_KEY) {
       console.warn('FCM: No VAPID key provided. Push will not work. Please add VITE_FIREBASE_VAPID_KEY in settings.');
       if (isManual) {
         setNotification({
           title: 'Configuration Manquante',
           body: 'La clé VAPID Firebase n\'est pas configurée. Veuillez l\'ajouter dans les variables d\'environnement.',
           type: 'error'
         });
       }
       return;
    }

    try {
      const result = await requestNotificationPermission(VAPID_KEY);
      console.log('FCM Registration Result:', result);
      
      if (result.status === 'unsupported') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isManual) {
        setNotification({
          title: 'Appareil Non Compatible',
          body: isIOS 
            ? 'Sur iPhone, les notifications nécessitent Safari et "Ajouter à l\'écran d\'accueil".' 
            : 'Votre navigateur actuel ne supporte pas les notifications Push.',
          type: 'warning'
        });
      }
      setShowPermissionBanner(false);
    } else if (result.status === 'denied') {
      if (isManual) {
        setNotification({
          title: 'Notifications Bloquées',
          body: 'Veuillez réactiver les notifications dans les paramètres de votre navigateur.',
          type: 'error'
        });
      }
      setShowPermissionBanner(false);
    } else if (result.token) {
      console.log('FCM Token Generated:', result.token);
      setFcmToken(result.token);
      localStorage.setItem('fcm_token', result.token);
      setShowPermissionBanner(false);
      
      if (session?.user?.id) {
        const { error } = await supabase.from('users').update({ 
          fcm_token: result.token,
          last_fcm_sync: new Date().toISOString() 
        }).eq('id', session.user.id);
        if (error) {
          console.error("Erreur de sauvegarde DB du token:", error);
          if (isManual) setNotification({title: 'Erreur', body: 'Erreur de synchro Database', type: 'error'});
        } else {
          console.log("FCM Token successfully saved to DB");
        }
      }
    } else {
       console.warn("FCM status granted but no token received.");
    }
    } catch (e: any) {
      console.error("FCM Request failed:", e);
      if (isManual) {
         setNotification({title: 'Erreur', body: 'Erreur de génération de token FCM.', type: 'error'});
      }
    }
  };

  // Handle FCM Notifications
  useEffect(() => {
    if (session) {
      if ('serviceWorker' in navigator) {
         navigator.serviceWorker.ready.then(() => {
            setupFCM();
         });
      } else {
         setupFCM();
      }
    }
  }, [session]);

  // Listen for foreground messages
  useEffect(() => {
    if (!session) return;
    
    const unsubscribe = onMessageListener((payload: any) => {
      if (payload?.notification) {
        setNotification({
          title: payload.notification.title,
          body: payload.notification.body,
        });
        
        // Optionnel: Déclencher une notification système même si l'app est ouverte
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(payload.notification.title, {
              body: payload.notification.body,
              icon: '/firebase-logo.png',
              tag: 'mz-plus-push-foreground'
            });
          });
        }

        // Auto-hide in-app notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') (unsubscribe as any)();
    };
  }, [session]);

  useEffect(() => {
    if (session && userProfile && !localStorage.getItem('mz_guide_completed')) {
      const timer = setTimeout(() => {
        setIsGuideActive(true);
        localStorage.setItem('mz_guide_completed', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session, userProfile]);

  // Sync PWA Branding from Database
  useEffect(() => {
    const syncBranding = async () => {
      try {
        const { data } = await supabase.from('mz_app_config').select('*').eq('id', 'main-config').maybeSingle();
        if (data) {
          if (data.app_name) {
            localStorage.setItem('pwa_custom_name', data.app_name);
            document.title = data.app_name;
          }
          if (data.icon_base64) {
            localStorage.setItem('pwa_custom_icon', data.icon_base64);
            const iconEl = document.querySelector('link[rel="icon"]');
            if (iconEl) iconEl.setAttribute('href', data.icon_base64);
            const appleIconEl = document.querySelector('link[rel="apple-touch-icon"]');
            if (appleIconEl) appleIconEl.setAttribute('href', data.icon_base64);
          }
        }
      } catch (e) {
        console.warn("Branding sync failed (ignore if table doesn't exist yet):", e);
      }
    };
    syncBranding();
  }, []);

  const fetchUserData = useCallback(async (userId: string, email?: string, fullName?: string, retryCount = 0) => {
    try {
      const userEmail = email?.toLowerCase().trim() || "";
      const isHardcodedAdmin = ADMIN_EMAILS.includes(userEmail);
      
      let { data: profile } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      
      let challengeState = null;
      if (profile) {
          const { data: cState } = await supabase.from('mz_challenge_3j_state').select('*').eq('user_id', userId).maybeSingle();
          if (cState) {
              challengeState = {
                presented: cState.presented,
                startedAt: cState.started_at,
                j1Completed: cState.j1_completed,
                j2Presented: cState.j2_presented,
                j2StartedAt: cState.j2_started_at,
                j2Completed: cState.j2_completed,
                j2CompletedAtStr: cState.j2_completed_at,
                j3Presented: cState.j3_presented,
                j3StartedAt: cState.j3_started_at,
                j3Completed: cState.j3_completed,
                cancelled: cState.cancelled
              };
          }
      }

      if (!profile) {
        const newRefCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newProfileData = { 
          id: userId, 
          full_name: fullName || 'Ambassadeur', 
          email: userEmail, 
          referral_code: newRefCode, 
          rank_id: 1, 
          is_admin: isHardcodedAdmin, 
          user_level: 'standard'
        };
        const { data: upsertedProfile } = await supabase.from('users').upsert(newProfileData, { onConflict: 'id' }).select('*').single();
        profile = upsertedProfile || (newProfileData as any);
      }

      const isAdminValue = isHardcodedAdmin || profile?.is_admin === true || !!profile?.admin_role;
      const enrichedProfile: UserProfile = { 
        id: profile?.id || userId, 
        full_name: profile?.full_name || fullName || 'Ambassadeur', 
        referral_code: profile?.referral_code || '---', 
        rank_id: profile?.rank_id || 1, 
        email: profile?.email || userEmail, 
        is_admin: isAdminValue, 
        admin_role: profile?.admin_role || (isHardcodedAdmin ? 'super_admin' : null),
        rpa_balance: Number(profile?.rpa_balance || 0), 
        rpa_points: Number(profile?.rpa_points || 0), 
        xp: Number(profile?.xp || 0),
        user_level: (profile?.user_level as 'standard' | 'niveau_mz_plus') || 'standard', 
        created_at: profile?.created_at,
        store_preferences: { ...(profile?.store_preferences || {}) },
        country_code: profile?.country_code || profile?.country
      };

      // Calculate the correct rank_id from xp immediately.
      let currentLevelIdx = 0;
      for (let i = 0; i < PROGRESSION_LEVELS.length; i++) {
        if (enrichedProfile.xp >= PROGRESSION_LEVELS[i].xp) {
          currentLevelIdx = i;
        }
      }
      const computedRankId = currentLevelIdx + 1;
      enrichedProfile.rank_name = PROGRESSION_LEVELS[currentLevelIdx].name;

      if (computedRankId !== enrichedProfile.rank_id) {
        enrichedProfile.rank_id = computedRankId;
        try {
          // Fire and forget update
          supabase.from('users').update({ rank_id: computedRankId }).eq('id', enrichedProfile.id).then();
        } catch (e) {
          console.error("Error updating rank_id", e);
        }
      }

      if (challengeState) {
          enrichedProfile.store_preferences.challenge_3j = challengeState;
      }

      
      // Handle challenge commands from Admin
      if (enrichedProfile.store_preferences?.challenge_command) {
        const command = enrichedProfile.store_preferences.challenge_command;
        const newPrefs = { ...enrichedProfile.store_preferences };
        const challenge = newPrefs.challenge_3j || {};
        
        if (command === 'reset') {
            newPrefs.challenge_3j = {};
        } else if (command === 'complete') {
            newPrefs.challenge_3j = {
               ...challenge,
               presented: true,
               j1Completed: true,
               startedAt: challenge.startedAt || new Date().toISOString()
            };
        }
        
        delete newPrefs.challenge_command;
        
        try {
          await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', enrichedProfile.id);
          enrichedProfile.store_preferences = newPrefs;
        } catch (e) {
          console.error("Error clearing challenge command", e);
        }
      }

      setUserProfile(enrichedProfile);

      const [walletRes, teamRes] = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('referral_code_used', enrichedProfile.referral_code)
      ]);

      setWallet(walletRes.data || { id: 'initial', user_id: userId, balance: 0 });
      setTeamCount(teamRes?.count || 0);
    } catch (error: any) {
      if (error?.code === 'PGRST303' || error?.message?.includes('JWT expired')) {
        console.warn('JWT expired during fetchUserData, signing out...');
        supabase.auth.signOut();
        return;
      }
      console.error("Fetch data error:", error);
      if (retryCount < 2 && (error.message?.includes('fetch') || error.name === 'TypeError')) {
        console.log(`Retrying fetchUserData (${retryCount + 1})...`);
        setTimeout(() => fetchUserData(userId, email, fullName, retryCount + 1), 1500);
        return;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const getInitialSession = async (retryCount = 0) => {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
          }
          throw error;
        }
        
        setSession(s); 
        if (s) fetchUserData(s.user.id, s.user.email, s.user.user_metadata?.full_name); 
        else if (isProductChecked) setLoading(false);
      } catch (error: any) {
        console.error("Initial session fetch error:", error);
        if (retryCount < 3 && (error.message?.includes('fetch') || error.name === 'TypeError')) {
          setTimeout(() => getInitialSession(retryCount + 1), 1000 * (retryCount + 1));
        } else {
          // If we encounter a hard error (like invalid token), clear session UI state
          setSession(null);
          if (isProductChecked) setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { 
      setSession(s); 
      if (s) fetchUserData(s.user.id, s.user.email, s.user.user_metadata?.full_name); 
      else { setUserProfile(null); if (isProductChecked) setLoading(false); } 
    });
    return () => subscription.unsubscribe();
  }, [fetchUserData, isProductChecked]);

  useEffect(() => {
    const checkProduct = async (retryCount = 0) => {
      try {
        const params = new URLSearchParams(window.location.search);
        const prodId = params.get('prod');
        const refCode = params.get('ref');
        const storeParam = params.get('store');
        const tabParam = params.get('tab') as TabId;

        if (storeParam) {
           setStoreOwnerCode(storeParam);
        }

        if (tabParam) {
           setActiveTab(tabParam);
        }

        if (prodId) {
          const { data: product, error } = await supabase.from('products').select('*').eq('id', prodId).maybeSingle();
          if (error) throw error;
          if (product) setCustomerProduct(product);
        }

        if (refCode) {
          const { data: referrer } = await supabase.from('users').select('id').eq('referral_code', refCode).maybeSingle();
          if (referrer && prodId) {
            setReferrerId(referrer.id);
            // Incrémenter le compteur de clics via RPC
            try {
              await supabase.rpc('mz_increment_product_clicks', { 
                p_user_id: referrer.id, 
                p_product_id: prodId 
              });
            } catch (err) {
              console.warn("Erreur incrémentation clics:", err);
            }
          }
        }

        setIsProductChecked(true);
      } catch (error: any) {
        console.error("Check product error:", error);
        if (retryCount < 2 && (error.message?.includes('fetch') || error.name === 'TypeError')) {
          setTimeout(() => checkProduct(retryCount + 1), 1000);
        } else {
          setIsProductChecked(true);
        }
      }
    };
    checkProduct();
  }, []);

  useEffect(() => {
    const handleViewProduct = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.product) {
        setCustomerProduct(customEvent.detail.product);
      }
    };
    const handleCloseProduct = () => {
      setCustomerProduct(null);
      if (window.location.search.includes('prod=')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    window.addEventListener('view-product-details', handleViewProduct);
    window.addEventListener('close-product-details', handleCloseProduct);

    const handleOpenReward = (e: any) => {
      const { rewardId, id, text, content, title } = e.detail || {};
      const actualId = rewardId || id;
      const actualContent = text || content || (actualId ? BONUS_CONTENTS[actualId] : null);
      
      if (actualContent) {
        setBonusContent({
          id: actualId || 'dynamic-reward',
          title: title || "CONTENU BONUS ÉLITE",
          content: actualContent
        });
      }
    };

    window.addEventListener('mz-open-reward-content', handleOpenReward);

    return () => {
      window.removeEventListener('view-product-details', handleViewProduct);
      window.removeEventListener('close-product-details', handleCloseProduct);
      window.removeEventListener('mz-open-reward-content', handleOpenReward);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'rpa' && !localStorage.getItem('mz_rpa_guide_completed')) {
      const timer = setTimeout(() => {
        setIsRPAGuideActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
    if (activeTab === 'team' && !localStorage.getItem('mz_team_guide_completed')) {
      const timer = setTimeout(() => {
        setIsTeamGuideActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const triggerRefresh = () => { 
    if (session?.user?.id) {
      fetchUserData(session.user.id, session.user.email, session.user.user_metadata?.full_name); 
    }
  };

  // GLOBAL HEARTBEAT : Suivi du temps pour le programme de récompense
  useEffect(() => {
    if (!userProfile?.id) return;
    
    const sendHeartbeat = async () => {
      try {
        const { error } = await supabase.rpc('mz_rewards_heartbeat', { p_user_id: userProfile.id });
        if (error) console.warn("Global heartbeat error:", error.message);
      } catch (e) {
        console.warn("Global heartbeat RPC not available");
      }
    };

    // Premier appel immédiat
    sendHeartbeat();
    
    // Puis toutes les 60 secondes (1 minute = 1 point)
    const interval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(interval);
  }, [userProfile?.id]);

  const handlePurchase = useCallback(async () => {
    setPurchaseStep('processing');
    
    // Enregistrer la commission si un parrain est détecté
    if (referrerId && customerProduct) {
      try {
        const { error: commError } = await supabase.from('commissions').insert([{
          user_id: referrerId,
          product_id: customerProduct.id,
          amount: customerProduct.commission_amount,
          status: 'pending'
        }]);
        
        if (commError) {
          console.error("Erreur lors de l'enregistrement de la commission:", commError);
        } else {
          console.log("Commission enregistrée avec succès pour l'ambassadeur:", referrerId);
        }
      } catch (err) {
        console.error("Exception lors de l'enregistrement de la commission:", err);
      }
    }

    // Redirection vers le lien final du produit
    setTimeout(() => {
      triggerAxisMessage('Transaction validée. Un nouvel accomplissement pour votre ascension.', 'success', 6000);
      if (customerProduct?.final_link) {
        window.location.href = customerProduct.final_link;
      } else {
        setPurchaseStep('view');
        alert("Lien de redirection manquant pour ce produit.");
      }
    }, 800); // Délai suffisant pour l'enregistrement et l'effet visuel
  }, [customerProduct, referrerId, triggerAxisMessage]);

  if (loading || !isProductChecked || initSequence) {
    return <SystemInitiator loading={loading} />;
  }

  if (storeOwnerCode) {
    return <StandalonePublicStore storeOwnerCode={storeOwnerCode} />;
  }
  
  if (customerProduct) return (<ProductSalesPage product={customerProduct} onPurchase={handlePurchase} purchaseStep={purchaseStep} countdown={900} isLoggedIn={!!session} />);
  if (!session) return <LandingPage />;

  const isAdmin = userProfile?.is_admin === true || !!userProfile?.admin_role;

  const handleShareClose = () => {
    setShowSharePopup(false);
    if (xpRewardSource === 'formation_complete') {
      let remaining7s = 7;
      const interval7s = setInterval(() => {
        if (document.visibilityState === 'visible') {
          remaining7s -= 1;
          if (remaining7s <= 0) {
            clearInterval(interval7s);
            triggerAxisMessage(
              "Allô, c'est moi, Axis 👁️\nMaintenant que tu as suivi la formation, il est temps de passer à l'action 🚀\nVa choisir ton produit 💰",
              'progression',
              15000,
              {
                label: "OK",
                action: () => {
                  hideAxis();
                  window.dispatchEvent(new CustomEvent('highlight-boutique'));
                }
              },
              'smart'
            );
          }
        }
      }, 1000);
      setXpRewardSource(""); // Clear to prevent double triggering
    }
  };

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      isAdmin={isAdmin} 
      profile={userProfile}
      isMenuOpen={isMenuOpen}
      setIsMenuOpen={setIsMenuOpen}
    >
      <ShareModal isVisible={showSharePopup} onClose={handleShareClose} referralCode={userProfile?.referral_code} />
      <PremiumAccessGate />
      
      <PushDisplay profile={userProfile} />
      
      {/* Permission Banner for Mobile/Iframe */}
      {showPermissionBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[10000] bg-yellow-600 p-4 md:p-6 animate-slide-up">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center shrink-0">
                <Bell className="text-white" size={24} />
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-sm tracking-tight">Activer les alertes MZ+</h4>
                <p className="text-yellow-100 text-xs mt-1">Recevez vos gains et bonus en temps réel sur votre mobile.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setupFCM(true)}
                className="flex-1 md:flex-none bg-white text-yellow-700 font-black uppercase text-[10px] px-6 py-3 rounded-xl shadow-lg hover:bg-neutral-100 transition-all"
              >
                Activer maintenant
              </button>
              <button 
                onClick={() => setShowPermissionBanner(false)}
                className="p-3 text-yellow-200 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          {window.self !== window.top && (
            <p className="text-[8px] text-yellow-200/60 text-center mt-3 uppercase font-bold tracking-widest">
              Note: Pour de meilleurs résultats sur mobile, ouvrez le site dans un nouvel onglet.
            </p>
          )}
        </div>
      )}

      {/* Foreground Notification Toast (FCM) */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] bg-neutral-900 border ${notification.type === 'error' ? 'border-red-500/50' : notification.type === 'warning' ? 'border-yellow-500/50' : 'border-yellow-500/30'} p-4 rounded-xl shadow-2xl animate-slide-down max-w-sm pointer-events-auto`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full ${notification.type === 'error' ? 'bg-red-500/10' : notification.type === 'warning' ? 'bg-yellow-500/10' : 'bg-yellow-500/10'} flex items-center justify-center shrink-0`}>
              {notification.type === 'error' ? (
                <AlertTriangle className="text-red-500" size={20} />
              ) : (
                <Sparkles className="text-yellow-500 animate-pulse" size={20} />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`${notification.type === 'error' ? 'text-red-500' : 'text-yellow-500'} font-bold text-sm`}>{notification.title}</h4>
              <p className="text-neutral-400 text-xs mt-1">{notification.body}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {/* Désactivation des popups Premium automatiques à la demande de l'utilisateur */}
      {/* <PremiumPopup user={userProfile} /> */}
      {/* <MZPlusPresentationOverlay profile={userProfile} onUpgrade={() => setActiveTab('flash_offer')} /> */}
      <AnnouncementOverlay profile={userProfile} onNavigate={(tab) => setActiveTab(tab as TabId)} />

      {activeTab === 'flash_offer' && <MZPlusFlashOfferOverlay profile={userProfile} onUpgrade={() => setActiveTab('upgrade')} onClose={() => setActiveTab('dashboard')} isFullPage={true} />}
      {activeTab === 'dashboard' && (
        <GlobalView 
          profile={userProfile} 
          onSwitchTab={setActiveTab} 
          onStartGuide={() => {
            if (!localStorage.getItem('mz_guide_completed')) {
              setIsGuideActive(true);
              localStorage.setItem('mz_guide_completed', 'true');
            }
          }}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          wallet={wallet}
          onRefresh={triggerRefresh}
        />
      )}
      <AffiliationGuide 
        isActive={isGuideActive} 
        onComplete={() => setIsGuideActive(false)} 
        activeCategory={activeCategory}
        activeTab={activeTab}
      />
      <RPAGuide 
        isActive={isRPAGuideActive} 
        onComplete={() => setIsRPAGuideActive(false)} 
      />
      <TeamGuide 
        isActive={isTeamGuideActive} 
        onComplete={() => setIsTeamGuideActive(false)} 
      />
      {activeTab === 'profile' && <ProfileTab profile={userProfile} onLogout={handleLogout} isAdmin={isAdmin} onSwitchTab={setActiveTab} onRefresh={triggerRefresh} />}
      {activeTab === 'live_withdrawals' && <LiveWithdrawalsView onBack={() => setActiveTab('dashboard')} />}
      {activeTab === 'axis' && <AxisChat profile={userProfile} onSwitchTab={setActiveTab} />}
      {activeTab === 'leaderboard' && <LeaderboardTab profile={userProfile} mode="global" />}
      {activeTab === 'leaderboard_local' && <LeaderboardTab profile={userProfile} mode="local" />}
      {activeTab === 'weekly_challenge' && <WeeklyChallenge profile={userProfile} teamCount={teamCount} onSwitchTab={setActiveTab} />}
      {activeTab === 'recompense' && <RewardFeature profile={userProfile} onSwitchTab={setActiveTab} />}
      {activeTab === 'private_chat' && <EspacePrive profile={userProfile} />}
      {activeTab === 'private_messaging' && <PrivateMessagingMain profile={userProfile} />}
      {activeTab === 'revenus' && <RevenueTab profile={userProfile} wallet={wallet} />}
      {(activeTab === 'affiliation' || activeTab === 'catalog') && <MyStore profile={userProfile} onSwitchTab={setActiveTab} onRefresh={triggerRefresh} />}
      {activeTab === 'team' && <TeamTab profile={userProfile} teamCount={teamCount} onSwitchTab={setActiveTab} />}
      {activeTab === 'coaching' && <CoachingTab profile={userProfile} onSwitchTab={setActiveTab} />}
      {activeTab === 'formation' && <FormationTab profile={userProfile} onSwitchTab={setActiveTab} />}
      {activeTab === 'rpa' && (
        <RPADashboard 
          profile={userProfile} 
          onRefresh={triggerRefresh} 
          onSwitchTab={setActiveTab} 
          onStartGuide={() => {
            localStorage.removeItem('mz_rpa_guide_completed');
            setIsRPAGuideActive(true);
          }}
        />
      )}
      {activeTab === 'suggestions' && <SuggestionsTab profile={userProfile} />}
      {activeTab === 'guides' && (
        <GuidesTab 
          onStartAffiliationGuide={() => {
            localStorage.removeItem('mz_guide_completed');
            setActiveTab('dashboard');
            setIsGuideActive(true);
          }}
          onStartRPAGuide={() => {
            localStorage.removeItem('mz_rpa_guide_completed');
            setActiveTab('rpa');
            setIsRPAGuideActive(true);
          }}
          onStartTeamGuide={() => {
            localStorage.removeItem('mz_team_guide_completed');
            setActiveTab('team');
            setIsTeamGuideActive(true);
          }}
        />
      )}
      {activeTab === 'upgrade' && <UpgradeTab />}
      {activeTab === 'luna_chat' && <LunaChatPage profile={userProfile} onUpgrade={() => setActiveTab('flash_offer')} />}
      {activeTab === 'sql_console' && isAdmin && <SQLConsole profile={userProfile} />}
      {activeTab === 'admin' && isAdmin && <AdminPanel adminProfile={userProfile} lastUpdateSignal={lastUpdateSignal} onRefresh={triggerRefresh} />}
      <AxisGuideFlow session={session} userProfile={userProfile} isReady={!loading && !initSequence} />
      <RankRewardChecker profile={userProfile} onRedirectProfile={() => {
        setActiveTab('profile');
        setTimeout(() => {
          const tube = document.getElementById('progression-section');
          if (tube) {
            tube.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }} />
      <XPRewardModal 
        isVisible={showXpReward} 
        amount={xpRewardAmount} 
        title={xpRewardTitle}
        description={xpRewardDesc}
        onComplete={() => {
          setShowXpReward(false);
          if (xpRewardSource === 'formation_complete') {
            let remaining5s = 5;
            const interval5s = setInterval(() => {
              if (document.visibilityState === 'visible') {
                remaining5s -= 1;
                if (remaining5s <= 0) {
                  clearInterval(interval5s);
                  setShowSharePopup(true);
                }
              }
            }, 1000);
          }
          const hasSeenChallenge = userProfile?.store_preferences?.challenge_3j?.presented;
          if (!hasSeenChallenge) {
             setChallengeTriggered(false);
             setChallengeEligible(true);
          }
        }} 
      />
      <ChallengePresentation 
        isVisible={showChallenge} 
        onAccept={() => {
          setShowChallenge(false);
          setActiveTab('formation');
          setTimeout(() => {
            triggerAxisMessage(
               "👉 \"Bravo ! pour ton engagement ! 🎉🎉 Juste avant de te lancer, il est important que tu suives cette formation.\"",
               'progression',
               15000,
               {
                 label: "Voir la formation",
                 action: () => {
                   hideAxis();
                   window.dispatchEvent(new CustomEvent('open-formation', { detail: { id: 'default-free-text' } }));
                 }
               },
               'smart'
            );
          }, 800);
        }} 
      />
      <ChallengePresentation 
        isVisible={showChallengeCelebration}
        mode="celebration"
        completedStep={challengeCelebratedStep}
        onAccept={() => {
          setShowChallengeCelebration(false);
        }}
      />
      <ChallengePresentation 
        isVisible={showChallengeDay2}
        mode="day2_intro"
        onAccept={() => {
          setShowChallengeDay2(false);
          setActiveTab('formation');
          updateChallengeDB({ j2Presented: true, j2StartedAt: new Date().toISOString() });
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-formation', { detail: { id: 'default-free-video' } }));
          }, 400);
        }}
        onClose={() => {
          setShowChallengeDay2(false);
          // Ne pas marquer comme présenté pour qu'on puisse le re-proposer "Plus tard"
        }}
      />
      <ChallengePresentation 
        isVisible={showChallengeDay3}
        mode="day3_intro"
        hasFailedDay2={forceDay3FailText || !userProfile?.store_preferences?.challenge_3j?.j2Completed}
        onAccept={() => {
          setShowChallengeDay3(false);
          setForceDay3FailText(false);
          updateChallengeDB({ j3Presented: true, j3StartedAt: new Date().toISOString() });
        }}
        onClose={() => {
          setShowChallengeDay3(false);
          setForceDay3FailText(false);
        }}
      />
      <ChallengePresentation 
        isVisible={showChallengeDay2Fail}
        mode="day2_fail_intro"
        onAccept={(action) => {
          setShowChallengeDay2Fail(false);
          setTimeout(() => {
            if (action === 'premium') {
              setPendingDay3TriggerAfterPremium(true);
              setActiveTab('flash_offer');
            } else {
              updateChallengeDB({ j3Presented: true, j3StartedAt: new Date().toISOString() });
              setForceDay3FailText(true);
              window.dispatchEvent(new CustomEvent('mz-trigger-3j-day3'));
            }
          }, 300);
        }}
        onClose={() => {
          setShowChallengeDay2Fail(false);
          updateChallengeDB({ j3Presented: true, j3StartedAt: new Date().toISOString() });
          setForceDay3FailText(true);
          window.dispatchEvent(new CustomEvent('mz-trigger-3j-day3'));
        }}
      />
      <AnimatePresence>
        {showDay2UpsellPopup && (
           <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowDay2UpsellPopup(false)}
           >
              <motion.div
                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.9, opacity: 0, y: 20 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                 onClick={e => e.stopPropagation()}
                 className="bg-[#111] border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full relative overflow-hidden shadow-[0_10px_50px_rgba(168,85,247,0.2)]"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-purple-500">
                    <Rocket size={80} />
                 </div>
                 
                 <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                       <Crown size={32} />
                    </div>
                    
                    <div className="space-y-4">
                       <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                         <span className="text-orange-500 mr-2">🔥</span>Tu comprends maintenant comment fonctionnent les ventes avec MZ+.
                       </h3>
                       
                       <p className="text-sm font-medium text-purple-200/70 leading-relaxed">
                         <span className="text-purple-400 mr-2">👑</span>Les membres MZ+ Premium obtiennent des résultats plus rapidement grâce à un accompagnement et des stratégies avancées.
                       </p>
                    </div>

                    <button
                       onClick={() => {
                          setShowDay2UpsellPopup(false);
                          setActiveTab('flash_offer');
                       }}
                       className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.02] transition-all relative overflow-hidden group border border-purple-400/30"
                    >
                       <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:opacity-100 opacity-60 z-20 pointer-events-none mix-blend-overlay" />
                       <span className="relative z-10 flex flex-col items-center gap-1">
                          <span>👉 En savoir plus 👑</span>
                       </span>
                    </button>
                    
                    <button
                       onClick={() => setShowDay2UpsellPopup(false)}
                       className="text-neutral-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                       Peut-être plus tard
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
        
        {showDay2FailedUpsellPopup && (
           <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowDay2FailedUpsellPopup(false)}
           >
              <motion.div
                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.9, opacity: 0, y: 20 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                 onClick={e => e.stopPropagation()}
                 className="bg-[#111] border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full relative overflow-hidden shadow-[0_10px_50px_rgba(168,85,247,0.2)]"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-purple-500">
                    <Rocket size={80} />
                 </div>
                 
                 <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-[var(--color-gold-main)] shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                       <Crown size={32} />
                    </div>
                    
                    <div className="space-y-4">
                       <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                         <span className="text-purple-500 mr-2">🎯</span>C'est normal de bloquer au début.
                       </h3>
                       
                       <p className="text-sm font-medium text-neutral-300 leading-relaxed">
                         <span className="text-purple-400 mr-2">⚡</span>Ne reste pas bloqué ! Les membres <strong className="text-[var(--color-gold-main)]">MZ+ Premium</strong> obtiennent des résultats beaucoup plus vite grâce à notre accompagnement et nos conseils.
                       </p>
                    </div>

                    <button
                       onClick={() => {
                          setShowDay2FailedUpsellPopup(false);
                          setActiveTab('flash_offer');
                       }}
                       className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.02] transition-all relative overflow-hidden group border border-purple-400/30"
                    >
                       <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:opacity-100 opacity-60 z-20 pointer-events-none mix-blend-overlay" />
                       <span className="relative z-10 flex flex-col items-center gap-1">
                          <span>👉 Découvrir MZ+ Premium 👑</span>
                       </span>
                    </button>
                    
                    <button
                       onClick={() => setShowDay2FailedUpsellPopup(false)}
                       className="text-neutral-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                       Peut-être plus tard
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
      <PWAInstallBanner />
      {bonusContent && (
        <TextFormationReader 
          title={bonusContent.title}
          content={bonusContent.content}
          formationId={bonusContent.id}
          type="bonus"
          onClose={() => setBonusContent(null)}
          onComplete={() => {}}
        />
      )}
    </DashboardLayout>
  );
};

const QUOTES = [
  { text: "Le risque le plus grand est de ne prendre aucun risque.", author: "Mark Zuckerberg" },
  { text: "Les riches investissent leur argent et dépensent ce qui reste.", author: "Jim Rohn" },
  { text: "Le meilleur investissement que vous puissiez faire est d’investir en vous-même.", author: "Warren Buffett" },
  { text: "La discipline crée des résultats que la motivation seule ne peut pas maintenir.", author: "Confucius" },
  { text: "Le succès n’est pas final, l’échec n’est pas fatal : c’est le courage de continuer qui compte.", author: "Winston Churchill" },
  { text: "Les opportunités ne se présentent pas. Vous les créez.", author: "Chris Grosser" },
  { text: "La régularité est la clé de la croissance exponentielle.", author: "Conseil MZ+" },
  { text: "Votre réseau est votre valeur nette. Connectez-vous avec les élites.", author: "Conseil MZ+" },
  { text: "Le défi 3J est conçu pour tester votre engagement initial.", author: "Conseil MZ+" },
  { text: "Ne travaillez pas pour l'argent, faites en sorte que l'argent travaille pour vous.", author: "Conseil MZ+" }
];

const SystemInitiator: React.FC<{ loading: boolean }> = ({ loading }) => {
  const [progress, setProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1.5;
      });
    }, 40);

    const quoteInterval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % QUOTES.length);
    }, 4500);

    return () => {
      clearInterval(interval);
      clearInterval(quoteInterval);
    };
  }, [loading]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,1),rgba(5,5,5,1))]" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-600/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-600/5 blur-[120px] rounded-full" />
      
      <div className="relative z-10 w-full max-w-2xl space-y-16 flex flex-col items-center">
        {/* Animated Icon */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-[2.5rem] flex items-center justify-center text-black shadow-[0_0_60px_rgba(202,138,4,0.2)]"
        >
          <Crown size={48} fill="currentColor" />
        </motion.div>

        {/* Content Area */}
        <div className="space-y-8 w-full min-h-[160px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="space-y-6 text-center"
            >
              <p className="text-xl sm:text-2xl md:text-3xl font-medium text-white/90 leading-tight tracking-tight italic font-serif max-w-lg mx-auto">
                “{QUOTES[quoteIndex].text}”
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-8 bg-yellow-600/30" />
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-yellow-600">
                  {QUOTES[quoteIndex].author}
                </p>
                <div className="h-[1px] w-8 bg-yellow-600/30" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress System */}
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Initialisation de votre système</span>
            <span className="text-[10px] font-mono text-yellow-600/60">{loading ? '...' : `${Math.round(progress)}%`}</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/[0.02]">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-600 to-yellow-500 shadow-[0_0_20px_rgba(202,138,4,0.4)]"
              initial={{ width: "0%" }}
              animate={{ width: loading ? "10%" : `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        {/* Footer Meta */}
        <div className="grid grid-cols-3 w-full max-w-md pt-8 border-t border-white/5 text-[8px] font-black uppercase tracking-[0.2em] text-white/10 uppercase">
           <div className="text-left">Intelligence MZ+</div>
           <div className="text-center">Élite Business</div>
           <div className="text-right">v7.4.2</div>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-30">
         <p className="text-[9px] font-black tracking-[0.5em] text-white/40 uppercase animate-pulse">L'ambition n'attends pas</p>
      </div>
    </div>
  );
};

export default App;

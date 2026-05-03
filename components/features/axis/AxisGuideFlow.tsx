import React, { useEffect, useCallback } from 'react';
import { useAxis } from './AxisProvider';

interface AxisGuideFlowProps {
  session: any;
  userProfile: any;
  isReady: boolean;
}

export const AxisGuideFlow: React.FC<AxisGuideFlowProps> = ({ session, userProfile, isReady }) => {
  const { triggerAxisMessage } = useAxis();

  const startGuide = useCallback(() => {
    const userName = userProfile?.full_name || session?.user?.user_metadata?.full_name?.split(' ')[0] || "partenaire";
    
    // Étape 1 : Salutation
    setTimeout(() => {
      triggerAxisMessage(
        `Salut ${userName}… moi c'est Axis. 👁️\nSi tu es ici, c'est que tu veux avancer. ⚡\nJe peux te guider… si tu es prêt.`,
        'guiding',
        0, // Reste affiché jusqu'à ce que l'utilisateur clique
        {
          label: "Je suis prêt",
          action: () => {
            // Lancer le scroll en premier
            window.dispatchEvent(new CustomEvent('mz-scroll-to-shop'));
            
            // Attendre la fin du scroll avant d'afficher le message et de mettre en évidence la boutique
            setTimeout(() => {
              triggerAxisMessage("Super. 🔥\nOn commence simplement.\nEntre dans ta boutique… je vais te montrer. 🛒", "guiding", 9000);
              window.dispatchEvent(new CustomEvent('mz-highlight-shop'));
            }, 1600);
            
            window.addEventListener('mz-shop-opened', () => {
              setTimeout(() => {
                const addBtn = document.getElementById('add-product-btn-empty') || document.getElementById('add-product-btn');
                
                if (addBtn) {
                  // Lancer le scroll vers le bouton ajouter
                  const targetY = addBtn.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2) + 50;
                  
                  const startY = window.scrollY;
                  const difference = targetY - startY;
                  let startTime: number | null = null;
                  const duration = 1500;
            
                  const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            
                  const step = (now: number) => {
                    if (!startTime) startTime = now;
                    const time = now - startTime;
                    const fraction = easeInOutCubic(Math.min(time / duration, 1));
                    window.scrollTo(0, startY + difference * fraction);
                    if (time < duration) window.requestAnimationFrame(step);
                  };
                  window.requestAnimationFrame(step);

                  // Afficher le message après le scroll
                  setTimeout(() => {
                    triggerAxisMessage("Tu y es… 👁️\nC’est ici que tout bascule.\nAjoute ton premier produit.", "guiding", 9000);
                    window.dispatchEvent(new CustomEvent('mz-highlight-add-product'));
                  }, 1600);
                } else {
                  triggerAxisMessage("Tu y es… 👁️\nC’est ici que tout bascule.\nAjoute ton premier produit.", "guiding", 9000);
                  window.dispatchEvent(new CustomEvent('mz-highlight-add-product'));
                }
              }, 500);
            }, { once: true });
            
            // When they open the catalog, highlight the first product
            window.addEventListener('mz-catalog-opened', () => {
               setTimeout(() => {
                 window.dispatchEvent(new CustomEvent('mz-highlight-first-product'));
                 
                 const btn = document.getElementById('first-catalog-product-btn');
                 if (btn) {
                   const targetY = btn.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2) + 50;
                   const startY = window.scrollY;
                   const difference = targetY - startY;
                   let startTime: number | null = null;
                   const duration = 1000;
                   const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                   const step = (now: number) => {
                     if (!startTime) startTime = now;
                     const time = now - startTime;
                     const fraction = easeInOutCubic(Math.min(time / duration, 1));
                     window.scrollTo(0, startY + difference * fraction);
                     if (time < duration) window.requestAnimationFrame(step);
                   };
                   window.requestAnimationFrame(step);
                 }
               }, 600);
            }, { once: true });
            
            // Final step: they open product details
            window.addEventListener('mz-product-details-opened', () => {
               setTimeout(() => {
                 window.dispatchEvent(new CustomEvent('mz-highlight-add-to-store'));
                 // Use center-modal position
                 triggerAxisMessage(
                   "On y est presque ⚡\nAjoute ce produit dans ta boutique maintenant\n\nUn simple clic…\net tu te rapproches de tes premiers revenus 💸",
                   "success",
                   9000,
                   undefined,
                   "center-modal"
                 );
               }, 500);
            }, { once: true });
            
            // Tutorial complete
            window.addEventListener('mz-product-added-to-store', () => {
               sessionStorage.setItem('mz_axis_guide_active', 'false');
               setTimeout(() => {
                 triggerAxisMessage(
                   "Félicitations. 🏆\nTon premier produit est en ligne !\nTu es maintenant prêt à conquérir.",
                   "success",
                   8000
                 );
               }, 800);
            }, { once: true });
          }
        }
      );
    }, 1500);
  }, [session, userProfile, triggerAxisMessage]);

  useEffect(() => {
    if (!isReady || !session) return;

    const handleForceWelcome = () => {
      sessionStorage.setItem('mz_axis_welcomed', 'true');
      sessionStorage.setItem('mz_axis_guide_active', 'true');
      startGuide();
    };

    window.addEventListener('mz-force-welcome-guide', handleForceWelcome);

    // Lancement automatique du guide uniquement si ce n'est pas déjà fait
    if (sessionStorage.getItem('mz_axis_welcomed') !== 'true') {
      const isInstalled = localStorage.getItem('mz_pwa_installed') === 'true' || 
                          window.matchMedia('(display-mode: standalone)').matches || 
                          (navigator as any).standalone;
                          
      const lastPrompt = localStorage.getItem('mz_pwa_prompt_timestamp');
      const recentlyPrompted = lastPrompt && Date.now() - parseInt(lastPrompt) < 24 * 60 * 60 * 1000;

      const runOnce = () => {
        sessionStorage.setItem('mz_axis_welcomed', 'true');
        sessionStorage.setItem('mz_axis_guide_active', 'true');
        startGuide();
      };

      if (isInstalled || recentlyPrompted) {
         runOnce();
      } else {
         // On attend la fermeture (ou la fin) de la bannière PWA
         window.addEventListener('mz-pwa-handled', runOnce, { once: true });
      }
    }

    return () => {
      window.removeEventListener('mz-force-welcome-guide', handleForceWelcome);
    };
  }, [isReady, session, startGuide]);

  return null;
};

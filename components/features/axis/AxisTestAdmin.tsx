import React, { useState } from 'react';
import { Play, Square, Settings, Zap, Star, ShieldAlert } from 'lucide-react';
import { useAxis, AxisState } from './AxisProvider.tsx';
import { GoldBorderCard, SectionTitle } from '../../UI.tsx';

export const AxisTestAdmin = () => {
  const { triggerAxisMessage, hideAxis, axisState, isVisible } = useAxis();
  const [testMessage, setTestMessage] = useState("Ceci est un test du système Axis.");
  const [duration, setDuration] = useState(5000);

  const testStates: { state: AxisState, label: string, icon: any, desc: string }[] = [
    { state: 'idle', label: 'Idle (Repos)', icon: Square, desc: 'État par défaut, attente silencieuse.' },
    { state: 'guiding', label: 'Guiding (Conseil)', icon: Settings, desc: 'Quand Axis donne un conseil.' },
    { state: 'action', label: 'Action (Engagement)', icon: Zap, desc: 'Lors d\'une interaction ou clic important.' },
    { state: 'progression', label: 'Progression (XP)', icon: Star, desc: 'Lors d\'un gain de niveau ou récompense.' },
    { state: 'success', label: 'Success (Victoire)', icon: ShieldAlert, desc: 'Lors d\'un achat ou grande réussite.' },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle title="Système Axis" subtitle="Panel de test des états d'Axis" />
      
      <GoldBorderCard>
        <div className="space-y-6 p-4">
          <div>
            <label className="block text-sm font-bold text-white/80 mb-2">Message de Test</label>
            <textarea 
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-gold-main)] transition-colors min-h-[100px]"
              placeholder="Saisissez un message que Axis prononcera..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white/80 mb-2">Durée (ms)</label>
            <input 
              type="number" 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-gold-main)] transition-colors"
            />
            <p className="text-xs text-white/50 mt-2">Mettez 0 pour que le message reste affiché indéfiniment.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-white/80 mb-2">Tester les états visuels</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testStates.map((ts) => (
                <button
                  key={ts.state}
                  onClick={() => triggerAxisMessage(testMessage, ts.state, duration)}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left group
                    ${axisState === ts.state && isVisible ? 'bg-white/10 border-white/50' : 'bg-black/40 border-white/10 hover:border-white/30'}
                  `}
                >
                  <div className={`p-3 rounded-xl bg-white/5 text-white group-hover:scale-110 transition-transform`}>
                    <ts.icon size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{ts.label}</div>
                    <div className="text-xs text-white/50 mt-1">{ts.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex gap-4">
             <button
              onClick={() => hideAxis()}
              className="px-6 py-3 bg-red-500/20 text-red-500 rounded-xl font-bold border border-red-500/50 hover:bg-red-500/30 transition-all"
             >
               Forcer la disparition
             </button>
          </div>
        </div>
      </GoldBorderCard>
    </div>
  );
};

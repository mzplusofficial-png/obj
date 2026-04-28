import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Zap, 
  Loader2, 
  Search, 
  Trash2, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  Target,
  ShoppingBasket
} from 'lucide-react';
import { supabase } from '../../../services/supabase.ts';
import { Product, UserProfile } from '../../../types.ts';
import { CurrencyDisplay } from '../../ui/CurrencyDisplay.tsx';

interface MyStoreProps {
  profile: UserProfile | null;
  onSwitchTab?: (tab: string) => void;
}

export const MyStore: React.FC<MyStoreProps> = ({ profile, onSwitchTab }) => {
  const [activeSegment, setActiveSegment] = useState<'my_products' | 'import_catalog'>('my_products');
  const [products, setProducts] = useState<Product[]>([]);
  const [storeProductIds, setStoreProductIds] = useState<string[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    try {
      const { data: allProds } = await supabase.from('products').select('*');
      setProducts(allProds || []);

      if (profile?.id) {
        const { data: myStore } = await supabase
          .from('mz_user_store')
          .select('product_id')
          .eq('user_id', profile.id);
        
        if (myStore) {
          setStoreProductIds(myStore.map((i: { product_id: string }) => i.product_id));
        } else {
          const stored = localStorage.getItem(`mz_store_${profile.id}`);
          if (stored) setStoreProductIds(JSON.parse(stored));
        }
      }
    } catch {
      console.warn("Store sync failed, using fallback");
    }
  };

  const handleImport = async (productId: string) => {
    if (!profile?.id) return;
    setImportingId(productId);
    
    try {
      await new Promise(r => setTimeout(r, 600));
      const newStore = [...storeProductIds, productId];
      
      try {
        await supabase.from('mz_user_store').upsert({ user_id: profile.id, product_id: productId });
      } catch(e) { console.error("DB error", e); }
      
      localStorage.setItem(`mz_store_${profile.id}`, JSON.stringify(newStore));
      setStoreProductIds(newStore);
      
      setFeedback("Propulsé dans ta boutique ! 🚀");
      setTimeout(() => setFeedback(null), 2500);
      setTimeout(() => setActiveSegment('my_products'), 800);
    } finally {
      setImportingId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    if (!profile?.id || removingId === productId) return;
    
    // Optimistic UI update
    const newStore = storeProductIds.filter(id => id !== productId);
    
    setRemovingId(productId);
    
    try {
      // Local updates first for instant feedback
      setStoreProductIds(newStore);
      localStorage.setItem(`mz_store_${profile.id}`, JSON.stringify(newStore));
      
      setFeedback("Produit retiré de ta boutique. 🗑️");
      setTimeout(() => setFeedback(null), 2500);

      // Backend sync
      const { error } = await supabase
        .from('mz_user_store')
        .delete()
        .eq('user_id', profile.id)
        .eq('product_id', productId);
      
      if (error) throw error;
      
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      // Fallback: restore previous state if DB delete definitely failed
      // But for a "remove" action, often users prefer it stays removed locally
      // setStoreProductIds(previousStore);
      setFeedback("Erreur de synchro, mais retiré localement.");
    } finally {
      setRemovingId(null);
    }
  };

  const myProducts = products.filter(p => storeProductIds.includes(p.id));
  const availableToImport = products.filter(p => !storeProductIds.includes(p.id) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-24 bg-[#0f0f12] min-h-screen max-w-full overflow-x-hidden">
      {/* HEADER SECTION */}
      <div className="px-6 sm:px-8 pt-14 flex items-center justify-between">
        <div className="flex flex-col">
           <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">Ma Boutique</h1>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
              <p className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase">Moteur de Revenus</p>
           </div>
        </div>

        {activeSegment === 'import_catalog' ? (
          <button 
            onClick={() => setActiveSegment('my_products')}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-xl"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <Target size={18} />
             </div>
          </div>
        )}
      </div>

      {/* TECH-FOCUSED STATS DASHBOARD */}
      <div className="px-6 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* STAT CARD: VISITS */}
          <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Visites</span>
              <TrendingUp size={14} className="text-white/20 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white tracking-tighter">0</span>
              <span className="text-[10px] font-bold text-emerald-500/40">+0%</span>
            </div>
            <div className="mt-4 h-[2px] bg-white/5 w-full rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500/20 w-1/4"></div>
            </div>
          </div>

          {/* STAT CARD: CONVERSION */}
          <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Taux Conv.</span>
              <Target size={14} className="text-white/20 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white tracking-tighter">0.0</span>
              <span className="text-[10px] font-bold text-white/20">%</span>
            </div>
            <div className="mt-4 h-[2px] bg-white/5 w-full rounded-full overflow-hidden">
              <div className="h-full bg-white/10 w-0"></div>
            </div>
          </div>

          {/* STAT CARD: REVENUE */}
          <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-6 rounded-[24px] relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Zap size={40} className="text-emerald-500" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500/60 mb-2 block">Position Nette</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tighter italic">0</span>
                <span className="text-2xl font-black text-emerald-500/40 italic">F</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-[#0f0f12] bg-white/10"></div>
                ))}
              </div>
              <span className="text-[9px] font-black uppercase text-white/20 tracking-widest italic">Attente de flux...</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="px-6 sm:px-8 flex-1">
        <AnimatePresence mode="wait">
          {activeSegment === 'my_products' ? (
            <motion.div 
              key="my_assets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {myProducts.length === 0 ? (
                <div className="py-24 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-10 relative">
                     <div className="absolute inset-0 border border-emerald-500/10 rounded-full animate-ping"></div>
                     <ShoppingBasket size={32} className="text-white/10" />
                  </div>
                  
                  <h3 className="text-3xl font-black text-white tracking-tighter mb-4 italic uppercase">Architecture Vide</h3>
                  <p className="text-[14px] text-white/30 max-w-[280px] leading-relaxed mb-14 font-medium uppercase tracking-tight">
                    Ton inventaire est inactif. Débloque tes premiers revenus en listant un actif.
                  </p>

                  <button 
                    onClick={() => setActiveSegment('import_catalog')}
                    className="w-full max-w-[340px] py-6 rounded-2xl bg-white text-black font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl hover:bg-emerald-400"
                  >
                    <Plus size={24} strokeWidth={3} /> Initialiser mon Stock
                  </button>
                </div>
              ) : (
                <div className="space-y-10 mt-4">
                  <div className="flex items-center justify-between opacity-30 mb-2">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em]">Mes Actifs Privés</span>
                     <span className="text-[10px] font-black italic">{myProducts.length} ARTICLES</span>
                  </div>
                  {myProducts.map((product) => (
                    <div key={product.id} className="group transition-all">
                      <div className="flex gap-8 items-center">
                        <div className="w-20 h-20 rounded-3xl overflow-hidden bg-black shrink-0 border border-white/5 relative">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-md font-black text-white uppercase italic truncate tracking-tight">{product.name}</h4>
                            <button 
                              onClick={() => handleRemove(product.id)}
                              disabled={removingId === product.id}
                              className="p-1.5 rounded-lg text-white/10 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            >
                              {removingId === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          </div>
                          <div className="flex items-center gap-10">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">Clicks</span>
                                <span className="text-sm font-black text-white italic">0</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-emerald-500/30 uppercase tracking-[0.2em] mb-1">Profit</span>
                                <span className="text-sm font-black text-emerald-400 italic">0 F</span>
                             </div>
                             <button className="ml-auto py-2.5 px-6 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all">
                                Promouvoir
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* ADD PRODUCT BUTTON AT THE END OF LIST */}
                  <button 
                    onClick={() => setActiveSegment('import_catalog')}
                    className="w-full h-24 rounded-[32px] bg-white/[0.02] border-2 border-dashed border-white/[0.05] flex items-center justify-center gap-4 text-white/20 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                      <Plus size={20} strokeWidth={3} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Ajouter un produit</span>
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="catalog"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/30 italic">Import d'Actifs</h2>
                 <button onClick={() => setActiveSegment('my_products')} className="text-[10px] font-bold text-white/20 hover:text-white transition-colors">ANNULER</button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-white/10" size={18} />
                <input 
                  type="text" 
                  placeholder="RECHERCHER UN ACTIF..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-b border-white/[0.08] py-5 pl-10 text-[11px] font-black uppercase tracking-[0.3em] text-white placeholder:text-white/10 outline-none focus:border-emerald-500/40 transition-colors"
                />
              </div>

              <div className="space-y-10">
                {availableToImport.map((product) => (
                  <div key={product.id} className="flex gap-6 items-center group">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black shrink-0 border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-500 opacity-40 group-hover:opacity-100">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white italic uppercase truncate mb-1 tracking-tight">{product.name}</h4>
                      <p className="text-[10px] font-bold text-emerald-500/40 uppercase transition-colors group-hover:text-emerald-400 tracking-widest">
                        +<CurrencyDisplay amount={product.commission_amount} className="inline px-1" /> COMMISSION
                      </p>
                    </div>
                    <button 
                      onClick={() => handleImport(product.id)}
                      disabled={importingId === product.id}
                      className="w-12 h-12 rounded-full border border-white/10 text-white flex items-center justify-center hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all active:scale-90"
                    >
                      {importingId === product.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Plus size={18} strokeWidth={3} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PREMIUM MINIMALIST FOOTER */}
      <div className="px-6 sm:px-8 mt-16 pb-12">
        <div className="p-8 sm:p-10 rounded-[40px] bg-white/[0.02] border border-white/[0.04] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-[80px] group-hover:bg-emerald-500/10 transition-all duration-1000"></div>
          <div className="relative z-10">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Sparkles size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Business Intelligence</span>
             </div>
             <h4 className="text-2xl font-black text-white italic leading-[1.1] uppercase mb-5 tracking-tighter max-w-[240px]">Épurer tes gains avec MZ+ Elite</h4>
             <p className="text-[12px] text-white/30 font-medium leading-relaxed mb-10 max-w-[260px]">
                Adopte les stratégies de scalabilité pour automatiser ta boutique aujourd'hui.
             </p>
             <button 
               onClick={() => onSwitchTab?.('flash_offer')}
               className="w-full py-5 rounded-[24px] bg-white text-black font-black uppercase text-[11px] tracking-[0.3em] hover:bg-emerald-400 transition-all shadow-2xl hover:shadow-emerald-500/20"
             >
                Upgrader vers l'Elite
             </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[400]"
          >
            <div className="bg-emerald-500 text-black px-10 py-5 rounded-full shadow-[0_20px_60px_rgba(16,185,129,0.4)] flex items-center gap-4">
               <Zap size={18} fill="currentColor" />
               <p className="text-[12px] font-black uppercase tracking-[0.2em]">{feedback}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
};

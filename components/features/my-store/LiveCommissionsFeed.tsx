import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../../types.ts';
import { CurrencyDisplay } from '../../ui/CurrencyDisplay.tsx';
import { Zap } from 'lucide-react';

const FIRST_NAMES = [
  "Amadou", "Mamadou", "Ousmane", "Awa", "Fatou", "Aminata", "Kofi", "Kwame", "Abdoulaye", "Cheikh",
  "Seydou", "Idrissa", "Kouamé", "Yao", "Aya", "Akissi", "Fanta", "Binta", "Mariam", "Ibrahim",
  "Moussa", "Aliou", "Hassan", "Khadija", "Ndeye", "Aissatou", "Saliou", "Lamine", "Malick", "Babacar",
  "Boubacar", "Youssouf", "Sekou", "Oumar", "Djibril", "Moustapha", "Salif", "Kadiatou", "Nanténin", "Hawa",
  "Assetou", "Kadi", "Zoumana", "Souleymane", "Modibo", "Lassina", "Oumou", "Djeneba", "Fatoumata", "Makhtar",
  "Pape", "Samba", "Demba", "Tidiane", "Assane", "Ousseynou", "Ababacar", "Madou", "Issa", "Ismael",
  "Mahamadou", "Bakary", "Sibiri", "Oumarou", "Kouassi", "Koffi", "Konan", "N'Guessan", "Kouadio", "Adjoua",
  "Amenan", "Ahou", "Affoué", "Amos", "Ezéchiel", "Samuel", "David", "Emmanuel", "Grâce", "Bénédicte",
  "Victoire", "Espérance", "Dieudonné", "Bienvenu", "Claver", "Evariste", "Félicien", "Eulalie", "Prisca", "Léocadie"
];

const LAST_INITIALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const generateName = () => {
   const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
   const initial = LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)];
   return `${first} ${initial}.`;
};

interface LiveSale {
  id: string;
  name: string;
  productId: string;
  productName: string;
  commission: number;
  time: Date;
  imageUrl: string;
}

export const LiveCommissionsFeed: React.FC<{ products: Product[] }> = ({ products }) => {
  const [sales, setSales] = useState<LiveSale[]>([]);

  const addSale = useCallback(() => {
    if (!products || products.length === 0) return;
    
    // Weighted selection favoring popular products or random
    const product = products[Math.floor(Math.random() * products.length)];
    
    const newSale: LiveSale = {
      id: Math.random().toString(36).substr(2, 9),
      name: generateName(),
      productId: product.id,
      productName: product.name,
      commission: product.commission_amount,
      time: new Date(),
      imageUrl: product.image_url
    };

    setSales(prev => {
      const updated = [newSale, ...prev];
      if (updated.length > 5) return updated.slice(0, 5);
      return updated;
    });
  }, [products]);

  useEffect(() => {
    // Initial populate
    if (products.length > 0 && sales.length === 0) {
      for(let i = 0; i < 3; i++) addSale();
    }
  }, [products, sales.length, addSale]);

  useEffect(() => {
    if (products.length === 0) return;

    const scheduleNextSale = () => {
      // Logic interval between 3 and 12 seconds
      const nextInterval = Math.floor(Math.random() * (12000 - 3000 + 1)) + 3000;
      return setTimeout(() => {
        addSale();
        timeoutId = scheduleNextSale();
      }, nextInterval);
    };

    let timeoutId = scheduleNextSale();

    return () => clearTimeout(timeoutId);
  }, [products, addSale]);

  if (products.length === 0) return null;

  return (
    <div className="mt-8 border border-white/5 rounded-[24px] overflow-hidden bg-white/[0.01]">
       <div className="p-4 sm:p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center relative">
             <div className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping" style={{ animationDuration: '3s' }}></div>
             <Zap size={14} className="text-[#10b981]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Activité Réseau Live</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Commissions générées en temps réel</p>
          </div>
       </div>

       <div className="p-4 sm:p-6 space-y-4">
          <AnimatePresence initial={false}>
             {sales.map((sale) => (
                <motion.div
                   key={sale.id}
                   initial={{ opacity: 0, y: -20, height: 0 }}
                   animate={{ opacity: 1, y: 0, height: 'auto' }}
                   exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
                   transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
                   className="flex items-center gap-4 bg-white/[0.03] p-3 sm:p-4 rounded-[16px] border border-white/5"
                >
                   <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black overflow-hidden border border-white/10 shrink-0">
                      <img src={sale.imageUrl} alt={sale.productName} className="w-full h-full object-cover opacity-80" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                         <p className="text-xs text-white truncate">
                            <span className="font-bold text-[#10b981]">{sale.name}</span> a vendu <span className="text-white/60">{sale.productName}</span>
                         </p>
                         <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-white/30 uppercase tracking-widest">à l'instant</span>
                            <span className="px-2 py-1 rounded-md bg-[#10b981]/10 text-[#10b981] text-[10px] font-black uppercase border border-[#10b981]/20">
                               + <CurrencyDisplay amount={sale.commission} hideSymbol /> F
                            </span>
                         </div>
                      </div>
                   </div>
                </motion.div>
             ))}
          </AnimatePresence>
       </div>
    </div>
  );
};

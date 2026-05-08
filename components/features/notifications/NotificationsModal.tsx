import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase.ts';
import { X, Bell, Trash2, Coins, Gift, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

interface NotificationsModalProps {
  onClose: () => void;
  profile: any;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose, profile }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch all notifications that match the user
      const { data } = await supabase
        .from('admin_push_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        // Filter based on target_type
        const relevant = data.filter(n => {
          if (n.target_type === 'all') return true;
          if (n.target_type === 'level') return n.target_value === profile.user_level;
          if (n.target_type === 'user') return n.target_value === profile.id;
          return false;
        });

        // Also fetch which ones are read
        const { data: readData } = await supabase
          .from('admin_push_receipts')
          .select('notification_id')
          .eq('user_id', profile.id);

        const readIds = new Set((readData || []).map(r => r.notification_id));

        const enriched = relevant.map(n => ({
          ...n,
          isRead: readIds.has(n.id)
        }));

        setNotifications(enriched);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
     try {
       const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
       if (unreadIds.length === 0) return;

       const inserts = unreadIds.map(id => ({ notification_id: id, user_id: profile.id }));
       await supabase.from('admin_push_receipts').insert(inserts);
       
       setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
     } catch(e) {
       console.error(e);
     }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'money': return <Coins className="text-yellow-500" size={20} />;
      case 'gift': return <Gift className="text-emerald-500" size={20} />;
      case 'alert': return <AlertTriangle className="text-red-500" size={20} />;
      default: return <Sparkles className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/60 backdrop-blur-sm sm:items-stretch items-end">
      <div 
        className="w-full sm:w-[400px] h-[85vh] sm:h-full bg-[#0a0a0a] border-t sm:border-t-0 sm:border-l border-white/10 flex flex-col animate-slide-up sm:animate-slide-left shadow-2xl relative"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-card-start)] border border-[var(--color-border-gold)] rounded-xl flex items-center justify-center">
              <Bell className="text-[var(--color-gold-main)]" size={20} />
            </div>
            <div>
              <h2 className="text-white font-black text-lg">Notifications</h2>
              <p className="text-neutral-400 text-xs">Vos dernières alertes MZ+</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex justify-end mb-2">
             <button 
                onClick={markAllAsRead} 
                className="text-xs text-[var(--color-gold-main)] flex items-center gap-1 hover:underline"
             >
                <CheckCircle2 size={12} /> Tout marquer comme lu
             </button>
          </div>
          
          {loading ? (
             <div className="py-12 flex justify-center">
               <div className="w-6 h-6 border-2 border-[var(--color-gold-main)] border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <Bell className="mx-auto mb-3 opacity-20" size={32} />
              <p className="text-sm">Aucune notification pour le moment.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 rounded-2xl border transition-colors ${n.isRead ? 'bg-white/5 border-white/5 opacity-70' : 'bg-[var(--color-card-start)] border-[var(--color-border-gold)] shadow-[0_0_15px_rgba(201,168,76,0.1)]'}`}
              >
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    {getIcon(n.icon_type)}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${n.isRead ? 'text-neutral-300' : 'text-white'}`}>{n.title}</h4>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-2">
                       {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import { supabase } from './supabase';

export interface InternalNotification {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: string;
  post_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NOTIFICATIONS_TABLE = 'internal_notifications';

export const getInternalNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data as InternalNotification[];
  } catch (error) {
    console.error("Error fetching internal notifications:", error);
    return [];
  }
};

export const getUnreadCount = async (userId: string, userLevel?: string) => {
  try {
    // 1. Count Internal Notifications
    const { count: internalCount, error: internalError } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (internalError) throw internalError;

    // 2. Count Admin Push Notifications (more complex as it depends on receipts)
    // First get all relevant notifications
    const { data: allNotifs } = await supabase
      .from('admin_push_notifications')
      .select('id, target_type, target_value');

    const relevantIds = (allNotifs || [])
      .filter(n => {
        if (n.target_type === 'all') return true;
        if (n.target_type === 'level' && userLevel) return n.target_value === userLevel;
        if (n.target_type === 'user') return n.target_value === userId;
        return false;
      })
      .map(n => n.id);

    if (relevantIds.length > 0) {
      const { data: readIds } = await supabase
        .from('admin_push_receipts')
        .select('notification_id')
        .eq('user_id', userId)
        .in('notification_id', relevantIds);

      const readSet = new Set((readIds || []).map(r => r.notification_id));
      const unreadPushCount = relevantIds.filter(id => !readSet.has(id)).length;
      
      return (internalCount || 0) + unreadPushCount;
    }

    return internalCount || 0;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
};

export const markAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

export const markAllAsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking all as read:", error);
    return false;
  }
};

export const subscribeToNotifications = (userId: string, onUpdate: () => void) => {
  const subscription = supabase
    .channel(`internal_notifications_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: NOTIFICATIONS_TABLE,
      filter: `recipient_id=eq.${userId}`
    }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

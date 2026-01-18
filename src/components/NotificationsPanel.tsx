import React, { useState, useEffect } from 'react';
import { X, Bell, Check, Package, CreditCard, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, onNavigate }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);

    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_placed':
      case 'order_status':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'seller_registration':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-amber-500 text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Bell className="w-6 h-6" />
                <h2 className="text-xl font-bold">Notifications</h2>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-amber-600 p-1 rounded transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">{unreadCount} unread</span>
                <button
                  onClick={markAllAsRead}
                  className="text-sm underline hover:no-underline"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Bell className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No notifications</h3>
                <p className="text-gray-500 text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex space-x-1">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-green-500 hover:text-green-600 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-4">
              <button
                onClick={() => {
                  onClose();
                  onNavigate('dashboard');
                }}
                className="w-full text-center text-amber-600 hover:text-amber-700 font-medium text-sm"
              >
                View All in Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

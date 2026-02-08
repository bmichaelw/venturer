import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ReminderManager() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPermission(Notification.permission);
    setNotificationsEnabled(Notification.permission === 'granted');
  }, []);

  const { data: items = [] } = useQuery({
    queryKey: ['items-with-reminders'],
    queryFn: () => base44.entities.Item.list('-created_date', 1000),
    refetchInterval: 60000, // Check every minute
    enabled: notificationsEnabled,
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Item.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items-with-reminders'] });
    },
  });

  useEffect(() => {
    if (!notificationsEnabled || !items.length) return;

    const now = new Date();
    
    items.forEach(item => {
      if (!item.reminder_datetime || item.reminder_sent) return;
      
      const reminderTime = new Date(item.reminder_datetime);
      
      // Check if reminder time has passed
      if (reminderTime <= now) {
        // Show notification
        new Notification('⏰ Reminder: ' + item.title, {
          body: item.description || 'Task reminder',
          icon: '/favicon.ico',
          tag: item.id,
          requireInteraction: false,
        });

        // Mark as sent
        updateReminderMutation.mutate({
          id: item.id,
          data: { reminder_sent: true }
        });
      }
    });
  }, [items, notificationsEnabled]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      setNotificationsEnabled(true);
      toast.success('Notifications enabled! You\'ll receive reminders for tasks.');
      
      // Test notification
      new Notification('✓ Reminders Activated', {
        body: 'You\'ll now receive notifications for your task reminders',
        icon: '/favicon.ico',
      });
    } else {
      toast.error('Notification permission denied');
    }
  };

  const toggleNotifications = () => {
    if (permission === 'granted') {
      setNotificationsEnabled(!notificationsEnabled);
      toast.success(notificationsEnabled ? 'Reminders paused' : 'Reminders resumed');
    } else {
      requestPermission();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleNotifications}
      className="relative"
    >
      {notificationsEnabled ? (
        <Bell className="w-5 h-5" />
      ) : (
        <BellOff className="w-5 h-5 text-slate-400" />
      )}
      {notificationsEnabled && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
      )}
    </Button>
  );
}
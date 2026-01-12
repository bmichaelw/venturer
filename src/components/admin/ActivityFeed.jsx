import React from 'react';
import { format } from 'date-fns';
import { TrendingUp, UserPlus, CheckCircle, Briefcase } from 'lucide-react';

export default function ActivityFeed({ events = [] }) {
  const getIcon = (type) => {
    switch (type) {
      case 'upgrade': return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'signup': return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'venture': return <Briefcase className="w-4 h-4 text-purple-600" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No recent activity</p>
        ) : (
          events.map((event, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="mt-0.5">{getIcon(event.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#0F172A] dark:text-white">{event.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
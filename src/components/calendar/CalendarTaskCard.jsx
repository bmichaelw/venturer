import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';

export default function CalendarTaskCard({ task, ventures, compact = false, onClick }) {
  const venture = ventures?.find((v) => v.id === task.venture_id);

  const statusConfig = {
    not_started: { icon: Circle, color: 'text-slate-400' },
    in_progress: { icon: Circle, color: 'text-amber-500' },
    completed: { icon: CheckCircle2, color: 'text-emerald-500' },
    canceled: { icon: Circle, color: 'text-slate-300' },
  };

  const config = statusConfig[task.status] || statusConfig.not_started;
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="text-xs p-1.5 rounded cursor-pointer hover:bg-stone-50 transition-colors truncate"
        style={{ borderLeft: `3px solid ${venture?.color || '#64748b'}` }}
      >
        <div className="flex items-center gap-1">
          <Icon className={`w-3 h-3 ${config.color} shrink-0`} />
          <span className={`truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
            {task.title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-stone-50 rounded-lg p-3 border border-stone-200 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start gap-2 mb-2">
        <Icon className={`w-4 h-4 mt-0.5 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold line-clamp-2 ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {task.title}
          </h4>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {venture && (
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: venture.color, color: venture.color }}
          >
            {venture.name}
          </Badge>
        )}

        {task.status && task.status !== 'not_started' && (
          <Badge
            variant="secondary"
            className={`text-xs ${
              task.status === 'completed'
                ? 'bg-emerald-100 text-emerald-700'
                : task.status === 'in_progress'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {task.status.replace('_', ' ')}
          </Badge>
        )}

        {task.p_priority && (
          <Badge
            variant="secondary"
            className={`text-xs ${
              task.p_priority === 3
                ? 'bg-red-100 text-red-700'
                : task.p_priority === 2
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            P:{task.p_priority}
          </Badge>
        )}
      </div>
    </div>
  );
}
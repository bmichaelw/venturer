import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { AlertCircle } from 'lucide-react';

export default function KanbanCard({ item, ventures }) {
  const venture = ventures.find(v => v.id === item.venture_id);
  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed';
  const priorityColors = {
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-amber-100 text-amber-800',
    3: 'bg-red-100 text-red-800',
  };
  const priorityLabels = { 1: 'Low', 2: 'Medium', 3: 'High' };

  return (
    <div className="bg-white rounded-lg border border-stone-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <h4 className="font-medium text-slate-900 text-sm mb-2 line-clamp-2">{item.title}</h4>

      <div className="space-y-2">
        {venture && (
          <Badge
            className="text-xs"
            style={{ backgroundColor: venture.color, color: 'white' }}
          >
            {venture.name}
          </Badge>
        )}

        <div className="flex gap-1 flex-wrap">
          {item.p_priority && (
            <Badge className={`text-xs ${priorityColors[item.p_priority]}`}>
              {priorityLabels[item.p_priority]}
            </Badge>
          )}
          {item.assigned_to && (
            <Badge variant="outline" className="text-xs">
              Assigned
            </Badge>
          )}
        </div>

        {item.due_date && (
          <div className="flex items-center gap-1 text-xs">
            {isOverdue && <AlertCircle className="w-3 h-3 text-red-500" />}
            <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}>
              {format(parseISO(item.due_date), 'MMM d')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
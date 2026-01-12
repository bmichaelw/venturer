import React from 'react';
import { Lightbulb, FileText, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function ItemCard({ item, ventures, onClick }) {
  const typeConfig = {
    idea: { icon: Lightbulb, color: 'bg-purple-100 text-purple-700', label: 'Idea' },
    note: { icon: FileText, color: 'bg-blue-100 text-blue-700', label: 'Note' },
    task: { icon: CheckSquare, color: 'bg-emerald-100 text-emerald-700', label: 'Task' },
  };

  const config = typeConfig[item.type] || typeConfig.note;
  const Icon = config.icon;

  const venture = ventures?.find((v) => v.id === item.venture_id);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-black/[0.08] p-5 hover:shadow-md hover:border-black/[0.12] transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div className={`${config.color} rounded-lg p-2.5 flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-slate-900 mb-1 line-clamp-1 leading-snug">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-[13px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[11px] font-medium">
              {config.label}
            </Badge>

            {venture && (
              <Badge
                variant="outline"
                className="text-[11px] font-medium"
                style={{ borderColor: venture.color, color: venture.color }}
              >
                {venture.name}
              </Badge>
            )}

            {item.type === 'task' && item.due_date && (
              <Badge variant="outline" className="text-[11px] text-slate-600 font-medium">
                Due {format(new Date(item.due_date), 'MMM d')}
              </Badge>
            )}

            {item.type === 'task' && item.status && (
              <Badge
                variant="secondary"
                className={`text-[11px] font-medium ${
                  item.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-600'
                    : item.status === 'in_progress'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.status.replace('_', ' ')}
              </Badge>
            )}
          </div>

          {/* STEP Indicators */}
          {(item.s_sextant || item.t_time || item.e_effort || item.p_priority) && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-black/[0.06]">
              {item.s_sextant && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="font-medium text-slate-500">S:</span>
                  <span className={`px-1.5 py-0.5 rounded-md font-medium ${
                    item.s_sextant === 1 || item.s_sextant === 5
                      ? 'bg-red-50 text-red-600'
                      : item.s_sextant === 2
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-50 text-slate-600'
                  }`}>
                    {['I', 'II', 'III', 'IV', 'V', 'VI'][item.s_sextant - 1]}
                  </span>
                </div>
              )}
              {item.t_time && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="font-medium text-slate-500">T:</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 font-medium">
                    {item.t_time}
                  </span>
                </div>
              )}
              {item.e_effort && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="font-medium text-slate-500">E:</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 font-medium">
                    {item.e_effort}
                  </span>
                </div>
              )}
              {item.p_priority && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="font-medium text-slate-500">P:</span>
                  <span className={`px-1.5 py-0.5 rounded-md font-medium ${
                    item.p_priority === 3
                      ? 'bg-red-50 text-red-600'
                      : item.p_priority === 2
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-green-50 text-green-600'
                  }`}>
                    {item.p_priority}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import DocumentList from '../components/documents/DocumentList';
import CommentSection from '../components/collaboration/CommentSection';
import ItemDetailPanel from '../components/dump/ItemDetailPanel';
import EnhancedTaskSuggestions from '../components/ai/EnhancedTaskSuggestions';

export default function ItemDetailPage() {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('id');
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: item } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const items = await base44.entities.Item.filter({ id: itemId });
      return items[0];
    },
    enabled: !!itemId,
  });

  const { data: venture } = useQuery({
    queryKey: ['venture', item?.venture_id],
    queryFn: async () => {
      if (!item?.venture_id) return null;
      const ventures = await base44.entities.Venture.filter({ id: item.venture_id });
      return ventures[0];
    },
    enabled: !!item?.venture_id,
  });

  const { data: project } = useQuery({
    queryKey: ['project', item?.project_id],
    queryFn: async () => {
      if (!item?.project_id) return null;
      const projects = await base44.entities.Project.filter({ id: item.project_id });
      return projects[0];
    },
    enabled: !!item?.project_id,
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.filter({ active: true }, 'name'),
  });

  const { data: assignedUser } = useQuery({
    queryKey: ['user', item?.assigned_to],
    queryFn: async () => {
      if (!item?.assigned_to) return null;
      const users = await base44.entities.User.filter({ email: item.assigned_to });
      return users[0];
    },
    enabled: !!item?.assigned_to,
  });

  const handleSuggestionUpdate = async (updates) => {
    await base44.entities.Item.update(itemId, updates);
    queryClient.invalidateQueries({ queryKey: ['item', itemId] });
  };

  if (!item) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const typeConfig = {
    idea: { icon: AlertCircle, color: 'bg-purple-100 text-purple-700', label: 'Idea' },
    note: { icon: Clock, color: 'bg-blue-100 text-blue-700', label: 'Note' },
    task: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Task' },
  };

  const config = typeConfig[item.type] || typeConfig.note;
  const Icon = config.icon;

  const statusColors = {
    not_started: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    canceled: 'bg-red-100 text-red-700',
  };

  const sextantLabels = {
    1: 'I - Urgent & Important',
    2: 'II - Not Urgent but Important',
    3: 'III - Urgent but Not Important',
    4: 'IV - Not Urgent & Not Important',
    5: 'V - Late but Important',
    6: 'VI - Late & Not Important',
  };

  const stepLabels = {
    t_time: { 1: 'Short', 2: 'Medium', 3: 'Long' },
    e_effort: { 1: 'Low', 2: 'Medium', 3: 'High' },
    p_priority: { 1: 'Low', 2: 'Medium', 3: 'High' },
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/Dump" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dump
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200/50 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4 flex-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{item.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={config.color}>{config.label}</Badge>
                {item.type === 'task' && item.status && (
                  <Badge className={statusColors[item.status]}>
                    {item.status.replace('_', ' ')}
                  </Badge>
                )}
                {venture && (
                  <Link to={`/VentureDetail?id=${venture.id}`}>
                    <Badge variant="outline" className="hover:bg-slate-50">
                      {venture.name}
                    </Badge>
                  </Link>
                )}
                {project && (
                  <Link to={`/ProjectDetail?id=${project.id}`}>
                    <Badge variant="outline" className="hover:bg-slate-50">
                      {project.name}
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
          </div>
          <Button onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        {item.description && (
          <div className="bg-stone-50 rounded-lg p-4 mb-6">
            <p className="text-slate-700 whitespace-pre-wrap">{item.description}</p>
          </div>
        )}

        {item.type === 'task' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {item.due_date && (
              <div className="p-4 bg-stone-50 rounded-lg">
                <div className="text-xs text-slate-600 mb-1">Due Date</div>
                <div className="font-semibold text-slate-900">
                  {format(parseISO(item.due_date), 'MMM d, yyyy')}
                </div>
              </div>
            )}
            {assignedUser && (
              <div className="p-4 bg-stone-50 rounded-lg">
                <div className="text-xs text-slate-600 mb-1">Assigned To</div>
                <div className="font-semibold text-slate-900">
                  {assignedUser.full_name || assignedUser.email}
                </div>
              </div>
            )}
            {item.estimated_time_minutes && (
              <div className="p-4 bg-stone-50 rounded-lg">
                <div className="text-xs text-slate-600 mb-1">Estimated Time</div>
                <div className="font-semibold text-slate-900">
                  {item.estimated_time_minutes} min
                </div>
              </div>
            )}
            {item.actual_time_minutes && (
              <div className="p-4 bg-stone-50 rounded-lg">
                <div className="text-xs text-slate-600 mb-1">Actual Time</div>
                <div className="font-semibold text-slate-900">
                  {item.actual_time_minutes} min
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP Method */}
        {(item.s_sextant || item.t_time || item.e_effort || item.p_priority) && (
          <div className="border-t border-stone-200 pt-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">STEP Method</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {item.s_sextant && (
                <div className="p-4 bg-stone-50 rounded-lg">
                  <div className="text-xs text-slate-600 mb-1">Sextant</div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {sextantLabels[item.s_sextant]}
                  </div>
                </div>
              )}
              {item.t_time && (
                <div className="p-4 bg-stone-50 rounded-lg">
                  <div className="text-xs text-slate-600 mb-1">Time</div>
                  <div className="font-semibold text-slate-900">
                    {stepLabels.t_time[item.t_time]}
                  </div>
                </div>
              )}
              {item.e_effort && (
                <div className="p-4 bg-stone-50 rounded-lg">
                  <div className="text-xs text-slate-600 mb-1">Effort</div>
                  <div className="font-semibold text-slate-900">
                    {stepLabels.e_effort[item.e_effort]}
                  </div>
                </div>
              )}
              {item.p_priority && (
                <div className="p-4 bg-stone-50 rounded-lg">
                  <div className="text-xs text-slate-600 mb-1">Priority</div>
                  <div className="font-semibold text-slate-900">
                    {stepLabels.p_priority[item.p_priority]}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {item.type === 'task' && (
          <div className="border-t border-stone-200 pt-6 mb-6">
            <EnhancedTaskSuggestions item={item} onUpdate={handleSuggestionUpdate} />
          </div>
        )}

        {/* Documents */}
        <div className="border-t border-stone-200 pt-6">
          <DocumentList entityType="item" entityId={itemId} />
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
        <CommentSection itemId={itemId} />
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <ItemDetailPanel
          item={item}
          onClose={() => {
            setShowEditModal(false);
            queryClient.invalidateQueries({ queryKey: ['item', itemId] });
          }}
          ventures={ventures}
        />
      )}
    </div>
  );
}
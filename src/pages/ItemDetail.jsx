import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, CheckCircle2, Clock, AlertCircle, Save, ChevronRight, HelpCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import DocumentList from '../components/documents/DocumentList';
import CommentSection from '../components/collaboration/CommentSection';
import ItemDetailPanel from '../components/dump/ItemDetailPanel';
import EnhancedTaskSuggestions from '../components/ai/EnhancedTaskSuggestions';

export default function ItemDetailPage() {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('id');
  const [showEditModal, setShowEditModal] = useState(false);
  const [nextStep, setNextStep] = useState('');
  const [isEditingNextStep, setIsEditingNextStep] = useState(false);
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

  const { data: projectItems = [] } = useQuery({
    queryKey: ['projectItems', item?.project_id],
    queryFn: async () => {
      if (!item?.project_id) return [];
      return await base44.entities.Item.filter({ project_id: item.project_id, type: 'task' });
    },
    enabled: !!item?.project_id,
  });

  const handleSuggestionUpdate = async (updates) => {
    await base44.entities.Item.update(itemId, updates);
    queryClient.invalidateQueries({ queryKey: ['item', itemId] });
  };

  const markCompleteMutation = useMutation({
    mutationFn: () => base44.entities.Item.update(itemId, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const saveNextStepMutation = useMutation({
    mutationFn: (step) => base44.entities.Item.update(itemId, { next_step: step }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      setIsEditingNextStep(false);
    },
  });

  const handleSaveNextStep = () => {
    saveNextStepMutation.mutate(nextStep);
  };

  React.useEffect(() => {
    if (item) {
      setNextStep(item.next_step || '');
    }
  }, [item]);

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

  const projectProgress = projectItems.length > 0 
    ? Math.round((projectItems.filter(i => i.status === 'completed').length / projectItems.length) * 100) 
    : 0;

  const isDueSoon = item.due_date && new Date(item.due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const isOverdue = item.due_date && new Date(item.due_date) < new Date();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top Bar - Identity & Actions */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6 mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600 mb-4 overflow-x-auto">
          <Link to="/Dump" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Dump
          </Link>
          {venture && (
            <>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <Link to={`/VentureDetail?id=${venture.id}`} className="hover:text-slate-900 transition-colors whitespace-nowrap">
                {venture.name}
              </Link>
            </>
          )}
          {project && (
            <>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <Link to={`/ProjectDetail?id=${project.id}`} className="hover:text-slate-900 transition-colors whitespace-nowrap">
                {project.name}
              </Link>
            </>
          )}
        </div>

        {/* Title & Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{item.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={config.color}>{config.label}</Badge>
              {item.type === 'task' && item.status && (
                <Badge className={statusColors[item.status]}>
                  {item.status.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {item.type === 'task' && item.status !== 'completed' && (
              <Button 
                variant="outline" 
                onClick={() => markCompleteMutation.mutate()}
                disabled={markCompleteMutation.isPending}
                className="flex-1 sm:flex-initial"
              >
                <CheckCircle2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Mark Complete</span>
              </Button>
            )}
            <Button onClick={() => setShowEditModal(true)} className="flex-1 sm:flex-initial">
              <Edit className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column - Work Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {item.description && (
            <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Description</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">{item.description}</p>
              </div>
            </div>
          )}

          {/* Next Step */}
          <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Next Step</h2>
            {isEditingNextStep ? (
              <div className="flex gap-2">
                <Input
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  placeholder="What's the immediate next action?"
                  className="flex-1"
                />
                <Button onClick={handleSaveNextStep} disabled={saveNextStepMutation.isPending}>
                  <Save className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => setIsEditingNextStep(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div 
                className="text-slate-700 cursor-pointer hover:bg-stone-50 p-3 rounded-lg transition-colors border border-transparent hover:border-stone-200"
                onClick={() => setIsEditingNextStep(true)}
              >
                {item.next_step || (
                  <span className="text-slate-400 italic">Click to add next step...</span>
                )}
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          {item.type === 'task' && (
            <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
              <EnhancedTaskSuggestions item={item} onUpdate={handleSuggestionUpdate} />
            </div>
          )}

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
            <DocumentList entityType="item" entityId={itemId} />
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
            <CommentSection itemId={itemId} />
          </div>
        </div>

        {/* Side Column - Context & Properties */}
        <div className="space-y-6">
          {/* STEP Panel */}
          {(item.s_sextant || item.t_time || item.e_effort || item.p_priority) && (
            <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">STEP Method</h3>
                <Link to="/StepKey" target="_blank">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {item.s_sextant && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-1">Sextant (S)</div>
                    <div className="text-sm text-slate-900 bg-stone-50 p-2 rounded">
                      S{item.s_sextant} - {sextantLabels[item.s_sextant]?.split(' - ')[1] || sextantLabels[item.s_sextant]}
                    </div>
                  </div>
                )}
                {item.t_time && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-1">Time (T)</div>
                    <div className="text-sm text-slate-900 bg-stone-50 p-2 rounded">
                      T{item.t_time} - {stepLabels.t_time[item.t_time]}
                    </div>
                  </div>
                )}
                {item.e_effort && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-1">Effort (E)</div>
                    <div className="text-sm text-slate-900 bg-stone-50 p-2 rounded">
                      E{item.e_effort} - {stepLabels.e_effort[item.e_effort]}
                    </div>
                  </div>
                )}
                {item.p_priority && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-1">Priority (P)</div>
                    <div className="text-sm text-slate-900 bg-stone-50 p-2 rounded">
                      P{item.p_priority} - {stepLabels.p_priority[item.p_priority]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates & Time Box */}
          {item.type === 'task' && (
            <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Timeline & Timing</h3>
              <div className="space-y-3">
                {item.due_date && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-1">Due Date</div>
                    <div className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-amber-600' : 'text-slate-900'}`}>
                      {format(parseISO(item.due_date), 'MMM d, yyyy')}
                      {isOverdue && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Overdue</span>}
                      {!isOverdue && isDueSoon && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Due Soon</span>}
                    </div>
                  </div>
                )}
                {item.follow_up_date && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-1">Follow-up Date</div>
                    <div className="text-sm text-slate-900">
                      {format(parseISO(item.follow_up_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                )}
                {item.estimated_time_minutes && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-1">Estimated Time</div>
                    <div className="text-sm text-slate-900">{item.estimated_time_minutes} minutes</div>
                  </div>
                )}
                {item.actual_time_minutes && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-1">Actual Time</div>
                    <div className="text-sm text-slate-900">{item.actual_time_minutes} minutes</div>
                  </div>
                )}
                {assignedUser && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-1">Assigned To</div>
                    <div className="text-sm text-slate-900">
                      {assignedUser.full_name || assignedUser.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Context Box */}
          <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Context</h3>
            <div className="space-y-3">
              {venture && (
                <div>
                  <div className="text-xs font-medium text-slate-600 mb-1">Venture</div>
                  <Link to={`/VentureDetail?id=${venture.id}`}>
                    <div className="flex items-center gap-2 text-sm text-slate-900 hover:text-slate-700 transition-colors">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: venture.color }}
                      />
                      {venture.name}
                    </div>
                  </Link>
                </div>
              )}
              {project && (
                <div>
                  <div className="text-xs font-medium text-slate-600 mb-1">Project</div>
                  <Link to={`/ProjectDetail?id=${project.id}`}>
                    <div className="text-sm text-slate-900 hover:text-slate-700 transition-colors">
                      {project.name}
                    </div>
                  </Link>
                  {projectItems.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>Project Progress</span>
                        <span>{projectProgress}%</span>
                      </div>
                      <Progress value={projectProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* History Box */}
          <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">History</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">Created</div>
                <div className="text-slate-900">
                  {format(parseISO(item.created_date), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">Last Updated</div>
                <div className="text-slate-900">
                  {format(parseISO(item.updated_date), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
              {item.type === 'task' && item.status === 'completed' && (
                <div>
                  <div className="text-xs font-medium text-slate-600 mb-1">Completed</div>
                  <div className="text-emerald-600 font-medium">
                    ✓ Task completed
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
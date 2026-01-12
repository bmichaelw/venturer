import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskSuggestions({ item, onUpdate }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (subtaskTitle) =>
      base44.entities.Item.create({
        title: subtaskTitle,
        type: 'task',
        venture_id: item.venture_id,
        project_id: item.project_id,
        status: 'not_started',
        parent_item_id: item.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Sub-task created');
    },
  });

  const analyzeSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('analyzeTask', {
        itemId: item.id,
        itemTitle: item.title,
        itemDescription: item.description,
        teamMembers: users.map(u => ({
          email: u.email,
          name: u.full_name || u.email,
          skills: [],
        })),
        dueDate: item.due_date,
      });

      setSuggestions(response.data);
      setExpanded(true);
    } catch (error) {
      toast.error('Failed to analyze task');
    } finally {
      setLoading(false);
    }
  };

  const acceptAssignment = async () => {
    if (!suggestions?.assignTo) return;
    try {
      await onUpdate({ assigned_to: suggestions.assignTo });
      toast.success('Task assigned based on AI suggestion');
    } catch (error) {
      toast.error('Failed to apply suggestion');
    }
  };

  const acceptPriority = async () => {
    if (!suggestions?.priority || !suggestions?.sextant) return;
    try {
      await onUpdate({
        p_priority: suggestions.priority,
        s_sextant: suggestions.sextant,
      });
      toast.success('Priority updated based on AI suggestion');
    } catch (error) {
      toast.error('Failed to apply suggestion');
    }
  };

  const createSubtasks = async () => {
    if (!suggestions?.subtasks?.length) return;
    for (const subtask of suggestions.subtasks) {
      createSubtaskMutation.mutate(subtask);
    }
  };

  if (!suggestions && !loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-slate-900">AI Task Assistant</h4>
              <p className="text-sm text-slate-600">Get smart suggestions for assignment, priority, and sub-tasks</p>
            </div>
          </div>
          <Button size="sm" onClick={analyzeSuggestions} className="bg-blue-600 hover:bg-blue-700">
            Analyze
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <span className="text-slate-600">AI is analyzing your task...</span>
      </div>
    );
  }

  if (!suggestions) return null;

  const assigneeName = users.find(u => u.email === suggestions.assignTo)?.full_name || suggestions.assignTo;
  const priorityLabels = ['', 'Low', 'Medium', 'High'];
  const sextantLabels = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-slate-900">AI Suggestions</h4>
            <p className="text-sm text-slate-600">
              {suggestions.confidence}% confidence • {suggestions.reasoning}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {suggestions.confidence}%
        </Badge>
      </div>

      {expanded && (
        <div className="space-y-4 pt-2 border-t border-blue-200">
          {/* Assignment Suggestion */}
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-start justify-between mb-2">
              <h5 className="font-medium text-slate-900">Assign To</h5>
              <Button
                size="sm"
                variant="outline"
                onClick={acceptAssignment}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                Accept
              </Button>
            </div>
            <p className="text-sm text-slate-600">
              Assigned to: <span className="font-semibold">{assigneeName}</span>
            </p>
          </div>

          {/* Priority Suggestion */}
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-start justify-between mb-2">
              <h5 className="font-medium text-slate-900">Priority & Urgency</h5>
              <Button
                size="sm"
                variant="outline"
                onClick={acceptPriority}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                Accept
              </Button>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-slate-600">Priority:</span>
                <span className="font-semibold ml-2">{priorityLabels[suggestions.priority]}</span>
              </div>
              <div>
                <span className="text-slate-600">Sextant:</span>
                <span className="font-semibold ml-2">S:{sextantLabels[suggestions.sextant]}</span>
              </div>
            </div>
          </div>

          {/* Sub-tasks Suggestion */}
          {suggestions.subtasks && suggestions.subtasks.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-slate-900">Suggested Sub-tasks</h5>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={createSubtasks}
                  disabled={createSubtaskMutation.isPending}
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  Create All
                </Button>
              </div>
              <ul className="space-y-1">
                {suggestions.subtasks.map((subtask, idx) => (
                  <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-600 font-semibold">•</span>
                    {subtask}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!expanded && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(true)}
          className="w-full text-blue-600 hover:bg-blue-100"
        >
          View Details
        </Button>
      )}
    </div>
  );
}
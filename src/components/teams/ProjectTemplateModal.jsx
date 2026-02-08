import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ProjectTemplateModal({ teamId, template, onClose }) {
  const [formData, setFormData] = useState(template || {
    name: '',
    description: '',
    estimated_duration_days: 30,
    project_type: 'general',
    subtasks: [],
    tags: [],
  });
  const [newSubtask, setNewSubtask] = useState({ 
    title: '', 
    description: '',
    estimated_days: 5,
    assigned_role: '',
    t_time: null,
    e_effort: null,
    p_priority: null
  });
  const [newTag, setNewTag] = useState('');
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (template) {
        return base44.entities.ProjectTemplate.update(template.id, data);
      }
      return base44.entities.ProjectTemplate.create({
        ...data,
        team_id: teamId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success(template ? 'Template updated' : 'Template created');
      onClose();
    },
  });

  const handleAddSubtask = () => {
    if (!newSubtask.title) return;
    setFormData({
      ...formData,
      subtasks: [...(formData.subtasks || []), newSubtask],
    });
    setNewSubtask({ 
      title: '', 
      description: '',
      estimated_days: 5,
      assigned_role: '',
      t_time: null,
      e_effort: null,
      p_priority: null
    });
  };

  const handleAddTag = () => {
    if (!newTag || formData.tags?.includes(newTag)) return;
    setFormData({
      ...formData,
      tags: [...(formData.tags || []), newTag],
    });
    setNewTag('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            {template ? 'Edit' : 'Create'} Project Template
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-9 sm:w-9">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Standard Product Launch"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this template used for?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimated_duration_days}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_duration_days: parseInt(e.target.value) })
                }
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Project Type</Label>
              <Select
                value={formData.project_type}
                onValueChange={(value) => setFormData({ ...formData, project_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="product_launch">Product Launch</SelectItem>
                  <SelectItem value="marketing_campaign">Marketing Campaign</SelectItem>
                  <SelectItem value="software_development">Software Development</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      tags: formData.tags.filter((_, i) => i !== idx)
                    })}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" size="sm" onClick={handleAddTag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-stone-200 pt-4">
            <Label>Sub-tasks</Label>
            <div className="space-y-2">
              {(formData.subtasks || []).map((task, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 bg-stone-50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 break-words">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-slate-600 mt-1 break-words">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                      <span>{task.estimated_days} days</span>
                      {task.assigned_role && <span>• {task.assigned_role}</span>}
                      {task.t_time && <span>• T:{task.t_time}</span>}
                      {task.e_effort && <span>• E:{task.e_effort}</span>}
                      {task.p_priority && <span>• P:{task.p_priority}</span>}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        subtasks: (formData.subtasks || []).filter((_, i) => i !== idx),
                      })
                    }
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3 p-3 sm:p-4 bg-stone-50 rounded-lg">
              <Input
                value={newSubtask.title}
                onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                placeholder="Sub-task title"
              />
              <Textarea
                value={newSubtask.description}
                onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Input
                  type="number"
                  value={newSubtask.estimated_days}
                  onChange={(e) =>
                    setNewSubtask({ ...newSubtask, estimated_days: parseInt(e.target.value) })
                  }
                  placeholder="Days"
                  min="1"
                />
                <Input
                  value={newSubtask.assigned_role}
                  onChange={(e) => setNewSubtask({ ...newSubtask, assigned_role: e.target.value })}
                  placeholder="Role"
                />
                <Select
                  value={newSubtask.t_time?.toString() || ''}
                  onValueChange={(v) => setNewSubtask({ ...newSubtask, t_time: v ? parseInt(v) : null })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    <SelectItem value="1">T:1</SelectItem>
                    <SelectItem value="2">T:2</SelectItem>
                    <SelectItem value="3">T:3</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newSubtask.p_priority?.toString() || ''}
                  onValueChange={(v) => setNewSubtask({ ...newSubtask, p_priority: v ? parseInt(v) : null })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    <SelectItem value="1">P:1</SelectItem>
                    <SelectItem value="2">P:2</SelectItem>
                    <SelectItem value="3">P:3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={handleAddSubtask}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Sub-task
              </Button>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-stone-200">
            <Button type="button" variant="outline" onClick={onClose} className="h-11 sm:h-9">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending || !formData.name}
              className="bg-slate-900 hover:bg-slate-800 h-11 sm:h-9"
            >
              {template ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
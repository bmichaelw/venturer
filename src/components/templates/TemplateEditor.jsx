import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';

export default function TemplateEditor({ template, onClose }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'other',
    is_public: template?.is_public || false,
    estimated_duration_days: template?.estimated_duration_days || '',
    default_status: template?.default_status || 'active',
    tasks: template?.tasks || [],
    milestones: template?.milestones || [],
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (template) {
        return base44.entities.ProjectTemplate.update(template.id, data);
      } else {
        return base44.entities.ProjectTemplate.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      onClose();
    },
  });

  const handleSave = () => {
    if (!formData.name.trim()) return;
    saveMutation.mutate(formData);
  };

  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [
        ...formData.tasks,
        {
          title: '',
          description: '',
          status: 'not_started',
          days_offset: 0,
        },
      ],
    });
  };

  const updateTask = (index, updates) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = { ...newTasks[index], ...updates };
    setFormData({ ...formData, tasks: newTasks });
  };

  const removeTask = (index) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((_, i) => i !== index),
    });
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        {
          title: '',
          description: '',
          days_offset: 0,
        },
      ],
    });
  };

  const updateMilestone = (index, updates) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = { ...newMilestones[index], ...updates };
    setFormData({ ...formData, milestones: newMilestones });
  };

  const removeMilestone = (index) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Product Launch, Marketing Campaign"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this template for?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.estimated_duration_days}
                  onChange={(e) => setFormData({ ...formData, estimated_duration_days: parseInt(e.target.value) || '' })}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Default Status</Label>
                <Select
                  value={formData.default_status}
                  onValueChange={(value) => setFormData({ ...formData, default_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
              <Label htmlFor="is_public" className="cursor-pointer">Make this template public (accessible to all users)</Label>
            </div>
          </div>

          {/* Milestones */}
          <div className="border-t border-stone-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Milestones</h3>
              <Button size="sm" variant="outline" onClick={addMilestone}>
                <Plus className="w-4 h-4 mr-1" />
                Add Milestone
              </Button>
            </div>

            {formData.milestones.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No milestones yet</p>
            ) : (
              <div className="space-y-3">
                {formData.milestones.map((milestone, index) => (
                  <div key={index} className="border border-stone-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-4 h-4 text-slate-400 mt-2" />
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Milestone title"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, { title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={milestone.description || ''}
                          onChange={(e) => updateMilestone(index, { description: e.target.value })}
                          rows={2}
                        />
                        <Input
                          type="number"
                          placeholder="Days after project start"
                          value={milestone.days_offset}
                          onChange={(e) => updateMilestone(index, { days_offset: parseInt(e.target.value) || 0 })}
                          className="w-48"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMilestone(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="border-t border-stone-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Tasks</h3>
              <Button size="sm" variant="outline" onClick={addTask}>
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
            </div>

            {formData.tasks.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No tasks yet</p>
            ) : (
              <div className="space-y-3">
                {formData.tasks.map((task, index) => (
                  <div key={index} className="border border-stone-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-4 h-4 text-slate-400 mt-2" />
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Task title"
                          value={task.title}
                          onChange={(e) => updateTask(index, { title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={task.description || ''}
                          onChange={(e) => updateTask(index, { description: e.target.value })}
                          rows={2}
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs mb-1">Status</Label>
                            <Select
                              value={task.status}
                              onValueChange={(value) => updateTask(index, { status: value })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not_started">Not Started</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs mb-1">Days Offset</Label>
                            <Input
                              type="number"
                              value={task.days_offset}
                              onChange={(e) => updateTask(index, { days_offset: parseInt(e.target.value) || 0 })}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1">Priority</Label>
                            <Select
                              value={task.p_priority?.toString() || ''}
                              onValueChange={(value) => updateTask(index, { p_priority: value ? parseInt(value) : null })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Low</SelectItem>
                                <SelectItem value="2">Medium</SelectItem>
                                <SelectItem value="3">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs mb-1">Est. Minutes</Label>
                            <Input
                              type="number"
                              value={task.estimated_time_minutes || ''}
                              onChange={(e) => updateTask(index, { estimated_time_minutes: parseInt(e.target.value) || null })}
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeTask(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-4 sm:px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim() || saveMutation.isPending}
            className="bg-[#223947] hover:bg-[#223947]/90"
          >
            {saveMutation.isPending ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </div>
    </div>
  );
}
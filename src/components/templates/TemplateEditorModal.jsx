import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateEditorModal({ template, isOpen, onClose }) {
  const [formData, setFormData] = useState(template || {
    name: '',
    description: '',
    category: 'other',
    icon_name: 'Globe',
    color: '#223947',
    estimated_duration_days: 30,
    milestones: [],
  });
  
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (template) {
        return base44.entities.ProjectTemplate.update(template.id, data);
      }
      return base44.entities.ProjectTemplate.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success(template ? 'Template updated' : 'Template created');
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ProjectTemplate.delete(template.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success('Template deleted');
      onClose();
    },
  });

  const handleAddMilestone = () => {
    setFormData({
      ...formData,
      milestones: [
        ...(formData.milestones || []),
        { name: '', week: 'Week 1', description: '', tasks: [] },
      ],
    });
    setExpandedMilestone((formData.milestones || []).length);
  };

  const handleUpdateMilestone = (index, updates) => {
    const newMilestones = [...(formData.milestones || [])];
    newMilestones[index] = { ...newMilestones[index], ...updates };
    setFormData({ ...formData, milestones: newMilestones });
  };

  const handleDeleteMilestone = (index) => {
    setFormData({
      ...formData,
      milestones: (formData.milestones || []).filter((_, i) => i !== index),
    });
  };

  const handleAddTask = (milestoneIndex) => {
    const newMilestones = [...(formData.milestones || [])];
    newMilestones[milestoneIndex].tasks = [
      ...(newMilestones[milestoneIndex].tasks || []),
      {
        title: '',
        description: '',
        days_offset: 0,
        step: { s: 1, t: 1, e: 1, p: 1 },
      },
    ];
    setFormData({ ...formData, milestones: newMilestones });
  };

  const handleUpdateTask = (milestoneIndex, taskIndex, updates) => {
    const newMilestones = [...(formData.milestones || [])];
    newMilestones[milestoneIndex].tasks[taskIndex] = {
      ...newMilestones[milestoneIndex].tasks[taskIndex],
      ...updates,
    };
    setFormData({ ...formData, milestones: newMilestones });
  };

  const handleDeleteTask = (milestoneIndex, taskIndex) => {
    const newMilestones = [...(formData.milestones || [])];
    newMilestones[milestoneIndex].tasks = newMilestones[milestoneIndex].tasks.filter(
      (_, i) => i !== taskIndex
    );
    setFormData({ ...formData, milestones: newMilestones });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter a template name');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit' : 'Create'} Project Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Product Launch"
                required
              />
            </div>

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
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this template used for?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
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
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon_name}
                onValueChange={(value) => setFormData({ ...formData, icon_name: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Globe">Globe</SelectItem>
                  <SelectItem value="Rocket">Rocket</SelectItem>
                  <SelectItem value="Megaphone">Megaphone</SelectItem>
                  <SelectItem value="Users">Users</SelectItem>
                  <SelectItem value="CalendarIcon">Calendar</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="GraduationCap">Graduation Cap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Milestones & Tasks</Label>
              <Button type="button" onClick={handleAddMilestone} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            </div>

            <div className="space-y-3">
              {(formData.milestones || []).map((milestone, mIdx) => (
                <div key={mIdx} className="border border-stone-200 rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 bg-stone-50 cursor-pointer hover:bg-stone-100"
                    onClick={() => setExpandedMilestone(expandedMilestone === mIdx ? null : mIdx)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {expandedMilestone === mIdx ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {milestone.name || `Milestone ${mIdx + 1}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({milestone.tasks?.length || 0} tasks)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMilestone(mIdx);
                      }}
                      className="h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  {expandedMilestone === mIdx && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Milestone Name</Label>
                          <Input
                            value={milestone.name}
                            onChange={(e) =>
                              handleUpdateMilestone(mIdx, { name: e.target.value })
                            }
                            placeholder="e.g., Planning Phase"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Week</Label>
                          <Input
                            value={milestone.week}
                            onChange={(e) =>
                              handleUpdateMilestone(mIdx, { week: e.target.value })
                            }
                            placeholder="e.g., Week 1-2"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={milestone.description}
                          onChange={(e) =>
                            handleUpdateMilestone(mIdx, { description: e.target.value })
                          }
                          placeholder="Milestone description..."
                          rows={2}
                        />
                      </div>

                      {/* Tasks */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Tasks</Label>
                        {(milestone.tasks || []).map((task, tIdx) => (
                          <div key={tIdx} className="bg-white border rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <Input
                                value={task.title}
                                onChange={(e) =>
                                  handleUpdateTask(mIdx, tIdx, { title: e.target.value })
                                }
                                placeholder="Task title..."
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTask(mIdx, tIdx)}
                                className="h-9 w-9 flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>

                            <Textarea
                              value={task.description}
                              onChange={(e) =>
                                handleUpdateTask(mIdx, tIdx, { description: e.target.value })
                              }
                              placeholder="Task description (optional)..."
                              rows={2}
                              className="text-sm"
                            />

                            <div className="grid grid-cols-5 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Days</Label>
                                <Input
                                  type="number"
                                  value={task.days_offset || 0}
                                  onChange={(e) =>
                                    handleUpdateTask(mIdx, tIdx, {
                                      days_offset: parseInt(e.target.value),
                                    })
                                  }
                                  min="0"
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">S (1-6)</Label>
                                <Input
                                  type="number"
                                  value={task.step?.s || 1}
                                  onChange={(e) =>
                                    handleUpdateTask(mIdx, tIdx, {
                                      step: { ...task.step, s: parseInt(e.target.value) },
                                    })
                                  }
                                  min="1"
                                  max="6"
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">T (1-3)</Label>
                                <Input
                                  type="number"
                                  value={task.step?.t || 1}
                                  onChange={(e) =>
                                    handleUpdateTask(mIdx, tIdx, {
                                      step: { ...task.step, t: parseInt(e.target.value) },
                                    })
                                  }
                                  min="1"
                                  max="3"
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">E (1-3)</Label>
                                <Input
                                  type="number"
                                  value={task.step?.e || 1}
                                  onChange={(e) =>
                                    handleUpdateTask(mIdx, tIdx, {
                                      step: { ...task.step, e: parseInt(e.target.value) },
                                    })
                                  }
                                  min="1"
                                  max="3"
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">P (1-3)</Label>
                                <Input
                                  type="number"
                                  value={task.step?.p || 1}
                                  onChange={(e) =>
                                    handleUpdateTask(mIdx, tIdx, {
                                      step: { ...task.step, p: parseInt(e.target.value) },
                                    })
                                  }
                                  min="1"
                                  max="3"
                                  className="h-9"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          onClick={() => handleAddTask(mIdx)}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Task
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {template && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this template?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Template'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? 'Saving...'
                  : template
                  ? 'Update Template'
                  : 'Create Template'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
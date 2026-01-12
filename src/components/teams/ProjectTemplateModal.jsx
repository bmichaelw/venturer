import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectTemplateModal({ teamId, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_duration_days: 30,
    subtasks: [],
  });
  const [newSubtask, setNewSubtask] = useState({ title: '', estimated_days: 5 });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ProjectTemplate.create({
        ...data,
        team_id: teamId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success('Template created');
      onClose();
    },
  });

  const handleAddSubtask = () => {
    if (!newSubtask.title) return;
    setFormData({
      ...formData,
      subtasks: [...formData.subtasks, newSubtask],
    });
    setNewSubtask({ title: '', estimated_days: 5 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Create Project Template</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

          <div className="space-y-3 border-t border-stone-200 pt-4">
            <Label>Sub-tasks</Label>
            <div className="space-y-2">
              {formData.subtasks.map((task, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.estimated_days} days</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        subtasks: formData.subtasks.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2 p-3 bg-stone-50 rounded-lg">
              <Input
                value={newSubtask.title}
                onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                placeholder="Sub-task title"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newSubtask.estimated_days}
                  onChange={(e) =>
                    setNewSubtask({ ...newSubtask, estimated_days: parseInt(e.target.value) })
                  }
                  placeholder="Estimated days"
                  min="1"
                  className="w-24"
                />
                <Button
                  type="button"
                  onClick={handleAddSubtask}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !formData.name}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Create Template
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
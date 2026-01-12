import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2 } from 'lucide-react';

export default function ItemDetailPanel({ item, onClose, ventures }) {
  const [formData, setFormData] = useState(item);
  const queryClient = useQueryClient();

  // Fetch projects when venture changes
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', formData.venture_id],
    queryFn: async () => {
      if (!formData.venture_id) return [];
      return base44.entities.Project.filter({ venture_id: formData.venture_id }, 'name');
    },
    enabled: !!formData.venture_id,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Item.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      onClose();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Item.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      onClose();
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ id: item.id, data: formData });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(item.id);
    }
  };

  // Clear project_id when venture changes
  useEffect(() => {
    if (formData.venture_id !== item.venture_id) {
      setFormData((prev) => ({ ...prev, project_id: null }));
    }
  }, [formData.venture_id]);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Edit Item</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-base"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="idea" id="idea" />
                <Label htmlFor="idea" className="cursor-pointer">Idea</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="note" id="note" />
                <Label htmlFor="note" className="cursor-pointer">Note</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="task" id="task" />
                <Label htmlFor="task" className="cursor-pointer">Task</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Venture */}
          <div className="space-y-2">
            <Label htmlFor="venture">Venture</Label>
            <Select
              value={formData.venture_id || 'none'}
              onValueChange={(value) =>
                setFormData({ ...formData, venture_id: value === 'none' ? null : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select venture" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No venture</SelectItem>
                {ventures.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          {formData.venture_id && (
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.project_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, project_id: value === 'none' ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Task-specific fields */}
          {formData.type === 'task' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || 'not_started'}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
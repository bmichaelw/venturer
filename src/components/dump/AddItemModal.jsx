import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function AddItemModal({ isOpen, onClose, ventureId, projectId }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: 'task',
    title: '',
    description: '',
    s_sextant: '',
    t_time: '',
    e_effort: '',
    p_priority: '',
    due_date: '',
    venture_id: ventureId || '',
    project_id: projectId || ''
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    const dataToSubmit = {
      ...formData,
      s_sextant: formData.s_sextant ? parseInt(formData.s_sextant) : undefined,
      t_time: formData.t_time ? parseInt(formData.t_time) : undefined,
      e_effort: formData.e_effort ? parseInt(formData.e_effort) : undefined,
      p_priority: formData.p_priority ? parseInt(formData.p_priority) : undefined,
      venture_id: formData.venture_id || undefined,
      project_id: formData.project_id || undefined,
    };

    await base44.entities.Item.create(dataToSubmit);
    queryClient.invalidateQueries({ queryKey: ['items'] });
    
    setFormData({
      type: 'task',
      title: '',
      description: '',
      s_sextant: '',
      t_time: '',
      e_effort: '',
      p_priority: '',
      due_date: '',
      venture_id: ventureId || '',
      project_id: projectId || ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="idea">Idea</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter title..."
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description..."
              rows={4}
            />
          </div>

          {formData.type === 'task' && (
            <>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Sextant (S)</Label>
                  <Select value={formData.s_sextant} onValueChange={(value) => setFormData({ ...formData, s_sextant: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Urgent+Important</SelectItem>
                      <SelectItem value="2">2 - Not Urgent+Important</SelectItem>
                      <SelectItem value="3">3 - Urgent+Not Important</SelectItem>
                      <SelectItem value="4">4 - Not Urgent+Not Important</SelectItem>
                      <SelectItem value="5">5 - Late+Important</SelectItem>
                      <SelectItem value="6">6 - Late+Not Important</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Time (T)</Label>
                  <Select value={formData.t_time} onValueChange={(value) => setFormData({ ...formData, t_time: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Short</SelectItem>
                      <SelectItem value="2">2 - Medium</SelectItem>
                      <SelectItem value="3">3 - Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Effort (E)</Label>
                  <Select value={formData.e_effort} onValueChange={(value) => setFormData({ ...formData, e_effort: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Low</SelectItem>
                      <SelectItem value="2">2 - Medium</SelectItem>
                      <SelectItem value="3">3 - High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priority (P)</Label>
                  <Select value={formData.p_priority} onValueChange={(value) => setFormData({ ...formData, p_priority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Low</SelectItem>
                      <SelectItem value="2">2 - Medium</SelectItem>
                      <SelectItem value="3">3 - High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim()}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
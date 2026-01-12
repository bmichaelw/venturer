import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#EF4444', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export default function VentureModal({ venture, onClose }) {
  const [formData, setFormData] = useState(
    venture || {
      name: '',
      description: '',
      color: '#3B82F6',
      active: true,
    }
  );

  const queryClient = useQueryClient();

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (venture) {
        return base44.entities.Venture.update(venture.id, data);
      } else {
        return base44.entities.Venture.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventures'] });
      queryClient.invalidateQueries({ queryKey: ['venture-item-counts'] });
      queryClient.invalidateQueries({ queryKey: ['venture-project-counts'] });
      onClose();
    },
  });

  const handleSave = () => {
    if (!formData.name.trim()) return;
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {venture ? 'Edit Venture' : 'New Venture'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sanguine Sound Therapy"
              className="text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this venture about?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-slate-900 ring-offset-2 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim() || saveMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            {venture ? 'Save Changes' : 'Create Venture'}
          </Button>
        </div>
      </div>
    </div>
  );
}
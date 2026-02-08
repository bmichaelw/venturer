import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FolderOpen, CheckSquare, Edit } from 'lucide-react';

export default function VentureCard({ venture, itemCount, projectCount, onEdit }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete all items in this venture
      await base44.entities.Item.filter({ venture_id: venture.id }).then(items => 
        Promise.all(items.map(item => base44.entities.Item.delete(item.id)))
      );
      // Delete all projects in this venture
      await base44.entities.Project.filter({ venture_id: venture.id }).then(projects =>
        Promise.all(projects.map(project => base44.entities.Project.delete(project.id)))
      );
      // Delete the venture
      await base44.entities.Venture.delete(venture.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventures'] });
      queryClient.invalidateQueries({ queryKey: ['venture-item-counts'] });
      queryClient.invalidateQueries({ queryKey: ['venture-project-counts'] });
      toast.success('Venture deleted');
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast.error('Failed to delete venture');
    },
  });
  return (
    <div className="bg-white rounded-2xl border border-stone-200/50 p-6 hover:shadow-lg transition-all group">
      {/* Color Bar */}
      <div
        className="w-12 h-1.5 rounded-full mb-4"
        style={{ backgroundColor: venture.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-1">{venture.name}</h3>
          {venture.description && (
            <p className="text-sm text-slate-600 line-clamp-2">{venture.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            onEdit(venture);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <FolderOpen className="w-4 h-4" />
          <span>{projectCount} {projectCount === 1 ? 'project' : 'projects'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <CheckSquare className="w-4 h-4" />
          <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        </div>
      </div>

      {/* Action */}
      <Link to={`/VentureDetail?id=${venture.id}`}>
        <Button variant="outline" className="w-full group-hover:bg-slate-900 group-hover:text-white transition-colors">
          View Projects
        </Button>
      </Link>
    </div>
  );
}
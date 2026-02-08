import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FolderOpen, CheckSquare, Edit, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <>
    <Link to={`/VentureDetail?id=${venture.id}`} className="block bg-white rounded-2xl border border-stone-200/50 p-6 hover:shadow-lg transition-all group">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(venture); }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.preventDefault(); setShowDeleteConfirm(true); }}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      <Button variant="outline" className="w-full group-hover:bg-slate-900 group-hover:text-white transition-colors">
        View Projects
      </Button>
    </Link>

    {/* Delete Confirmation Dialog */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
        <div className="bg-white rounded-lg p-6 max-w-md m-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-2">Delete Venture?</h3>
          <p className="text-sm text-slate-600 mb-4">
            This will permanently delete "{venture.name}" and all {projectCount} projects and {itemCount} items within it. This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
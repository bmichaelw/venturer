import React from 'react';
import { createPageUrl } from '../../utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FolderOpen, CheckSquare, Edit } from 'lucide-react';

export default function VentureCard({ venture, itemCount, projectCount, onEdit }) {
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
      <Link to={createPageUrl('VentureDetail', `id=${venture.id}`)}>
        <Button variant="outline" className="w-full group-hover:bg-slate-900 group-hover:text-white transition-colors">
          View Projects
        </Button>
      </Link>
    </div>
  );
}
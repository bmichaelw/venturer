import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FilterBar({ filters, setFilters, ventures, projects }) {
  const hasActiveFilters = filters.venture_id || filters.project_id || filters.type;

  const clearFilters = () => {
    setFilters({ venture_id: null, project_id: null, type: null });
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200/50 p-4 mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-slate-700">Filter by:</span>

        {/* Venture Filter */}
        <Select
          value={filters.venture_id || 'all'}
          onValueChange={(value) =>
            setFilters({ ...filters, venture_id: value === 'all' ? null : value, project_id: null })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Ventures" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ventures</SelectItem>
            {ventures.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Project Filter */}
        {filters.venture_id && (
          <Select
            value={filters.project_id || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, project_id: value === 'all' ? null : value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Type Filter */}
        <Select
          value={filters.type || 'all'}
          onValueChange={(value) =>
            setFilters({ ...filters, type: value === 'all' ? null : value })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="idea">Ideas</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-600 hover:text-slate-900"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
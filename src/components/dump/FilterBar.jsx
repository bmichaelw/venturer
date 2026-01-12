import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function FilterBar({ filters, setFilters, ventures, projects }) {
  const hasActiveFilters = 
    filters.venture_id || 
    filters.project_id || 
    filters.type || 
    filters.s_sextant?.length > 0 ||
    filters.t_time?.length > 0 ||
    filters.e_effort?.length > 0 ||
    filters.p_priority?.length > 0;

  const clearFilters = () => {
    setFilters({ 
      venture_id: null, 
      project_id: null, 
      type: null,
      s_sextant: [],
      t_time: [],
      e_effort: [],
      p_priority: []
    });
  };

  const toggleSTEPFilter = (field, value) => {
    const current = filters[field] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFilters({ ...filters, [field]: updated });
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200/50 p-5 mb-4 space-y-4">
      {/* Primary Filters */}
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
            Clear All
          </Button>
        )}
      </div>

      {/* STEP Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-stone-200">
        {/* Sextant */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-2 block">Sextant</label>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((val) => (
              <Badge
                key={val}
                onClick={() => toggleSTEPFilter('s_sextant', val)}
                className={`cursor-pointer text-xs ${
                  (filters.s_sextant || []).includes(val)
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                S:{['I', 'II', 'III', 'IV', 'V', 'VI'][val - 1]}
              </Badge>
            ))}
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-2 block">Time</label>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3].map((val) => (
              <Badge
                key={val}
                onClick={() => toggleSTEPFilter('t_time', val)}
                className={`cursor-pointer text-xs ${
                  (filters.t_time || []).includes(val)
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                T:{val}
              </Badge>
            ))}
          </div>
        </div>

        {/* Effort */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-2 block">Effort</label>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3].map((val) => (
              <Badge
                key={val}
                onClick={() => toggleSTEPFilter('e_effort', val)}
                className={`cursor-pointer text-xs ${
                  (filters.e_effort || []).includes(val)
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                E:{val}
              </Badge>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-2 block">Priority</label>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3].map((val) => (
              <Badge
                key={val}
                onClick={() => toggleSTEPFilter('p_priority', val)}
                className={`cursor-pointer text-xs ${
                  (filters.p_priority || []).includes(val)
                    ? val === 3
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : val === 2
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                    : val === 3
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : val === 2
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                P:{val}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
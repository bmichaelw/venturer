import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdvancedFilters({ 
  filters, 
  onChange, 
  onClear, 
  onSave,
  ventures = [], 
  projects = [],
  users = []
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">Advanced Filters</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="w-3.5 h-3.5 mr-1.5" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Type */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Type</Label>
          <div className="space-y-2 border rounded-md p-3 bg-gray-50">
            {['idea', 'note', 'task'].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.types?.includes(type) || false}
                  onCheckedChange={(checked) => {
                    const newTypes = checked
                      ? [...(filters.types || []), type]
                      : (filters.types || []).filter(t => t !== type);
                    onChange({ ...filters, types: newTypes.length > 0 ? newTypes : null });
                  }}
                />
                <label htmlFor={`type-${type}`} className="text-sm capitalize cursor-pointer">
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Venture */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Venture</Label>
          <div className="space-y-2 border rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
            {ventures.map((v) => (
              <div key={v.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`venture-${v.id}`}
                  checked={filters.venture_ids?.includes(v.id) || false}
                  onCheckedChange={(checked) => {
                    const newVentureIds = checked
                      ? [...(filters.venture_ids || []), v.id]
                      : (filters.venture_ids || []).filter(id => id !== v.id);
                    onChange({ ...filters, venture_ids: newVentureIds.length > 0 ? newVentureIds : null });
                  }}
                />
                <label htmlFor={`venture-${v.id}`} className="text-sm cursor-pointer">
                  {v.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Project */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Project</Label>
          <div className="space-y-2 border rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`project-${p.id}`}
                  checked={filters.project_ids?.includes(p.id) || false}
                  onCheckedChange={(checked) => {
                    const newProjectIds = checked
                      ? [...(filters.project_ids || []), p.id]
                      : (filters.project_ids || []).filter(id => id !== p.id);
                    onChange({ ...filters, project_ids: newProjectIds.length > 0 ? newProjectIds : null });
                  }}
                />
                <label htmlFor={`project-${p.id}`} className="text-sm cursor-pointer">
                  {p.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Assignee */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Assigned To</Label>
          <div className="space-y-2 border rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="assignee-unassigned"
                checked={filters.assigned_tos?.includes('unassigned') || false}
                onCheckedChange={(checked) => {
                  const newAssignees = checked
                    ? [...(filters.assigned_tos || []), 'unassigned']
                    : (filters.assigned_tos || []).filter(a => a !== 'unassigned');
                  onChange({ ...filters, assigned_tos: newAssignees.length > 0 ? newAssignees : null });
                }}
              />
              <label htmlFor="assignee-unassigned" className="text-sm cursor-pointer">
                Unassigned
              </label>
            </div>
            {users.map((u) => (
              <div key={u.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`assignee-${u.id}`}
                  checked={filters.assigned_tos?.includes(u.email) || false}
                  onCheckedChange={(checked) => {
                    const newAssignees = checked
                      ? [...(filters.assigned_tos || []), u.email]
                      : (filters.assigned_tos || []).filter(a => a !== u.email);
                    onChange({ ...filters, assigned_tos: newAssignees.length > 0 ? newAssignees : null });
                  }}
                />
                <label htmlFor={`assignee-${u.id}`} className="text-sm cursor-pointer">
                  {u.full_name || u.email}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</Label>
          <div className="space-y-2 border rounded-md p-3 bg-gray-50">
            {['not_started', 'in_progress', 'completed', 'canceled'].map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.statuses?.includes(status) || false}
                  onCheckedChange={(checked) => {
                    const newStatuses = checked
                      ? [...(filters.statuses || []), status]
                      : (filters.statuses || []).filter(s => s !== status);
                    onChange({ ...filters, statuses: newStatuses.length > 0 ? newStatuses : null });
                  }}
                />
                <label htmlFor={`status-${status}`} className="text-sm cursor-pointer capitalize">
                  {status.replace('_', ' ')}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Creation Date */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Created After</Label>
          <Input
            type="date"
            value={filters.created_after || ''}
            onChange={(e) => onChange({ ...filters, created_after: e.target.value })}
            className="h-9"
          />
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Due Before</Label>
          <Input
            type="date"
            value={filters.due_before || ''}
            onChange={(e) => onChange({ ...filters, due_before: e.target.value })}
            className="h-9"
          />
        </div>

        {/* Completion Date */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Completed After</Label>
          <Input
            type="date"
            value={filters.completed_after || ''}
            onChange={(e) => onChange({ ...filters, completed_after: e.target.value })}
            className="h-9"
          />
        </div>
      </div>

      {/* STEP Filters */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 block">STEP Criteria</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sextant */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Sextant</Label>
            <Select
              value={filters.s_sextant?.toString() || 'all'}
              onValueChange={(value) => onChange({ ...filters, s_sextant: value === 'all' ? null : parseInt(value) })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">I - Urgent & Important</SelectItem>
                <SelectItem value="2">II - Not Urgent but Important</SelectItem>
                <SelectItem value="3">III - Urgent but Not Important</SelectItem>
                <SelectItem value="4">IV - Not Urgent & Not Important</SelectItem>
                <SelectItem value="5">V - Late & Important</SelectItem>
                <SelectItem value="6">VI - Late & Not Important</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Time</Label>
            <Select
              value={filters.t_time?.toString() || 'all'}
              onValueChange={(value) => onChange({ ...filters, t_time: value === 'all' ? null : parseInt(value) })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">Short</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Effort */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Effort</Label>
            <Select
              value={filters.e_effort?.toString() || 'all'}
              onValueChange={(value) => onChange({ ...filters, e_effort: value === 'all' ? null : parseInt(value) })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Priority</Label>
            <Select
              value={filters.p_priority?.toString() || 'all'}
              onValueChange={(value) => onChange({ ...filters, p_priority: value === 'all' ? null : parseInt(value) })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
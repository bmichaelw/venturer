import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) => onChange({ ...filters, type: value === 'all' ? null : value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="idea">Idea</SelectItem>
              <SelectItem value="note">Note</SelectItem>
              <SelectItem value="task">Task</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Venture */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Venture</Label>
          <Select
            value={filters.venture_id || 'all'}
            onValueChange={(value) => onChange({ ...filters, venture_id: value === 'all' ? null : value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All ventures" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ventures</SelectItem>
              {ventures.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Project */}
        {filters.venture_id && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Project</Label>
            <Select
              value={filters.project_id || 'all'}
              onValueChange={(value) => onChange({ ...filters, project_id: value === 'all' ? null : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Assignee */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Assigned To</Label>
          <Select
            value={filters.assigned_to || 'all'}
            onValueChange={(value) => onChange({ ...filters, assigned_to: value === 'all' ? null : value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Anyone</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onChange({ ...filters, status: value === 'all' ? null : value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
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
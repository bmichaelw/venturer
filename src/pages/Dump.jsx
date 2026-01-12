import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Filter, Grid3x3, Bookmark } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ItemCard from '../components/dump/ItemCard';
import ItemDetailPanel from '../components/dump/ItemDetailPanel';
import KanbanCard from '../components/kanban/KanbanCard';
import GlobalSearchBar from '../components/search/GlobalSearchBar';
import AdvancedFilters from '../components/search/AdvancedFilters';
import SavedFiltersModal from '../components/search/SavedFiltersModal';

const STATUSES = [
  { id: 'not_started', label: 'Not Started', color: 'bg-slate-100' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-100' },
  { id: 'canceled', label: 'Canceled', color: 'bg-red-100' },
];

export default function DumpPage() {
  const [quickAddValue, setQuickAddValue] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [filters, setFilters] = useState({
    venture_id: null,
    project_id: null,
    type: null,
    status: null,
    assigned_to: null,
    created_after: null,
    due_before: null,
    completed_after: null,
    s_sextant: null,
    t_time: null,
    e_effort: null,
    p_priority: null,
  });
  const [sortBy, setSortBy] = useState('-created_date');

  const queryClient = useQueryClient();

  // Fetch items
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const result = await base44.entities.Item.list();
      return result;
    },
  });

  const items = React.useMemo(() => {
    let filtered = [...allItems];

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const titleMatch = item.title?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const assigneeMatch = item.assigned_to?.toLowerCase().includes(query);
        const commentMatch = comments
          .filter(c => c.item_id === item.id)
          .some(c => c.content?.toLowerCase().includes(query));
        return titleMatch || descMatch || assigneeMatch || commentMatch;
      });
    }

    // Apply filters
    if (filters.venture_id) {
      filtered = filtered.filter(item => item.venture_id === filters.venture_id);
    }
    if (filters.project_id) {
      filtered = filtered.filter(item => item.project_id === filters.project_id);
    }
    if (filters.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.assigned_to) {
      if (filters.assigned_to === 'unassigned') {
        filtered = filtered.filter(item => !item.assigned_to);
      } else {
        filtered = filtered.filter(item => item.assigned_to === filters.assigned_to);
      }
    }
    if (filters.created_after) {
      filtered = filtered.filter(item => 
        new Date(item.created_date) >= new Date(filters.created_after)
      );
    }
    if (filters.due_before) {
      filtered = filtered.filter(item => 
        item.due_date && new Date(item.due_date) <= new Date(filters.due_before)
      );
    }
    if (filters.completed_after) {
      filtered = filtered.filter(item =>
        item.status === 'completed' &&
        item.updated_date &&
        new Date(item.updated_date) >= new Date(filters.completed_after)
      );
    }
    if (filters.s_sextant) {
      filtered = filtered.filter(item => item.s_sextant === filters.s_sextant);
    }
    if (filters.t_time) {
      filtered = filtered.filter(item => item.t_time === filters.t_time);
    }
    if (filters.e_effort) {
      filtered = filtered.filter(item => item.e_effort === filters.e_effort);
    }
    if (filters.p_priority) {
      filtered = filtered.filter(item => item.p_priority === filters.p_priority);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const field = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
      const direction = sortBy.startsWith('-') ? -1 : 1;

      let aVal = a[field];
      let bVal = b[field];

      // Handle dates
      if (field === 'created_date' || field === 'updated_date' || field === 'due_date') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      // Handle nulls
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
      return 0;
    });

    return filtered;
  }, [allItems, filters, sortBy, searchQuery, comments]);

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.filter({ active: true }, 'name'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', filters.venture_id],
    queryFn: async () => {
      if (!filters.venture_id) return [];
      return base44.entities.Project.filter({ venture_id: filters.venture_id }, 'name');
    },
    enabled: !!filters.venture_id,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments'],
    queryFn: () => base44.entities.Comment.list(),
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: (newItem) => base44.entities.Item.create(newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setQuickAddValue('');
    },
  });

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickAddValue.trim()) return;

    createItemMutation.mutate({
      title: quickAddValue,
      type: 'note',
    });
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ itemId, newStatus }) =>
      base44.entities.Item.update(itemId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    updateStatusMutation.mutate({ itemId: draggableId, newStatus: destination.droppableId });
  };

  const kanbanItems = useMemo(() => {
    return items.filter(item => item.type === 'task');
  }, [items]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xs font-semibold text-[#4B5563] uppercase tracking-widest mb-2">DUMP</h1>
        <p className="text-2xl font-semibold text-[#101827]">Get everything out of your head first.</p>
        <p className="text-[#4B5563] mt-1">We'll help you sort it later.</p>
      </div>

      {/* Quick Add */}
      <form onSubmit={handleQuickAdd} className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-black/[0.08] dark:border-gray-700 p-5 transition-all hover:shadow-md">
          <div className="flex gap-3">
            <Input
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 text-[15px] border-0 bg-transparent dark:text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              style={{ boxShadow: 'none' }}
            />
            <Button
              type="submit"
              disabled={!quickAddValue.trim() || createItemMutation.isPending}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 h-11 rounded-lg font-medium text-sm transition-all hover:shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add
            </Button>
          </div>
        </div>
      </form>

      {/* Search & Filters */}
      <div className="mb-6">
        <GlobalSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          onToggleFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          showFilters={showAdvancedFilters}
        />
      </div>

      {showAdvancedFilters && (
        <AdvancedFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({
            venture_id: null,
            project_id: null,
            type: null,
            status: null,
            assigned_to: null,
            created_after: null,
            due_before: null,
            completed_after: null,
            s_sextant: null,
            t_time: null,
            e_effort: null,
            p_priority: null,
          })}
          onSave={() => setShowSavedFilters(true)}
          ventures={ventures}
          projects={projects}
          users={allUsers}
        />
      )}

      {/* View Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavedFilters(true)}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Saved Filters
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            {viewMode === 'kanban' ? 'List' : 'Kanban'}
          </Button>
          {viewMode === 'list' && (
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_date">Newest First</SelectItem>
                <SelectItem value="created_date">Oldest First</SelectItem>
                <SelectItem value="-updated_date">Recently Updated</SelectItem>
                <SelectItem value="due_date">Due Date (Earliest)</SelectItem>
                <SelectItem value="-due_date">Due Date (Latest)</SelectItem>
                <SelectItem value="s_sextant">Sextant (1-6)</SelectItem>
                <SelectItem value="-p_priority">Priority (High-Low)</SelectItem>
                <SelectItem value="p_priority">Priority (Low-High)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <span className="text-sm text-slate-500 dark:text-gray-400">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* View Mode */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-[#4B5563]">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-[#E5E7EB] p-8">
              <p className="text-[#101827] text-lg font-medium mb-2">Got too many things in your head?</p>
              <p className="text-[#4B5563]">Start dropping them here.</p>
            </div>
          ) : (
            items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                ventures={ventures}
                onClick={() => setSelectedItem(item)}
              />
            ))
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map((status) => {
              const statusItems = kanbanItems.filter(item => item.status === status.id);
              return (
                <div
                  key={status.id}
                  className={`${status.color} rounded-xl border-2 border-dashed border-slate-300 p-4 min-h-[400px]`}
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-slate-900">{status.label}</h3>
                    <p className="text-xs text-slate-600 mt-1">{statusItems.length} tasks</p>
                  </div>
                  <Droppable droppableId={status.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-white/50 rounded-lg p-2' : ''
                        }`}
                      >
                        {statusItems.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`transition-all ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                onClick={() => setSelectedItem(item)}
                              >
                                <KanbanCard item={item} ventures={ventures} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Item Detail Panel */}
      {selectedItem && (
        <ItemDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          ventures={ventures}
        />
      )}

      {/* Saved Filters Modal */}
      <SavedFiltersModal
        isOpen={showSavedFilters}
        onClose={() => setShowSavedFilters(false)}
        currentFilters={filters}
        onApplyFilter={(savedFilters) => setFilters(savedFilters)}
      />
    </div>
  );
}
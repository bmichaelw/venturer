import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Filter, Grid3x3, Bookmark } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ItemCard from '../components/dump/ItemCard';
import KanbanCard from '../components/kanban/KanbanCard';
import GlobalSearchBar from '../components/search/GlobalSearchBar';
import AdvancedFilters from '../components/search/AdvancedFilters';
import SavedFiltersModal from '../components/search/SavedFiltersModal';
import DashboardAssistant from '../components/ai/DashboardAssistant';

const STATUSES = [
  { id: 'not_started', label: 'Not Started', color: 'bg-slate-100' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-100' },
  { id: 'canceled', label: 'Canceled', color: 'bg-red-100' },
];

export default function DumpPage() {
  const [quickAddValue, setQuickAddValue] = useState('');

  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [filters, setFilters] = useState({
    venture_ids: null,
    project_ids: null,
    types: null,
    statuses: null,
    assigned_tos: null,
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

  const { data: comments = [] } = useQuery({
    queryKey: ['comments'],
    queryFn: () => base44.entities.Comment.list(),
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.filter({ active: true }, 'name'),
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('name'),
  });

  const projects = React.useMemo(() => {
    if (!filters.venture_ids || filters.venture_ids.length === 0) return allProjects;
    return allProjects.filter(p => filters.venture_ids.includes(p.venture_id));
  }, [allProjects, filters.venture_ids]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
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
    if (filters.venture_ids && filters.venture_ids.length > 0) {
      filtered = filtered.filter(item => filters.venture_ids.includes(item.venture_id));
    }
    if (filters.project_ids && filters.project_ids.length > 0) {
      filtered = filtered.filter(item => filters.project_ids.includes(item.project_id));
    }
    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(item => filters.types.includes(item.type));
    }
    if (filters.statuses && filters.statuses.length > 0) {
      filtered = filtered.filter(item => filters.statuses.includes(item.status));
    }
    if (filters.assigned_tos && filters.assigned_tos.length > 0) {
      filtered = filtered.filter(item => {
        if (filters.assigned_tos.includes('unassigned')) {
          if (!item.assigned_to) return true;
        }
        return item.assigned_to && filters.assigned_tos.includes(item.assigned_to);
      });
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
        <h1 className="text-xs text-[#805c5c] uppercase tracking-widest mb-2">DUMP</h1>
        <p className="text-xl sm:text-2xl text-[#323232] font-bold">Get everything out of your head first.</p>
        <p className="text-sm sm:text-base text-[#323232] mt-1">We'll help you sort it later.</p>
      </div>

      {/* Quick Add */}
      <form onSubmit={handleQuickAdd} className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-[#dbb4b4] p-5 transition-all hover:shadow-md">
          <div className="flex gap-3">
            <Input
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 text-[15px] border-0 bg-transparent text-[#323232] focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-[#805c5c]"
              style={{ boxShadow: 'none', fontFamily: 'Montserrat' }}
            />
            <Button
              type="submit"
              disabled={!quickAddValue.trim() || createItemMutation.isPending}
              className="bg-[#223947] hover:bg-[#223947]/90 text-[#fffbf6] px-5 h-11 rounded-lg font-medium text-sm transition-all hover:shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add
            </Button>
          </div>
        </div>
      </form>

      {/* AI Dashboard Assistant */}
      <div className="mb-8">
        <DashboardAssistant items={allItems} ventures={ventures} projects={projects} />
      </div>

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
            venture_ids: null,
            project_ids: null,
            types: null,
            statuses: null,
            assigned_tos: null,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavedFilters(true)}
            className="flex-1 sm:flex-initial"
          >
            <Bookmark className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Saved Filters</span>
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
            className="flex-1 sm:flex-initial"
          >
            <Grid3x3 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{viewMode === 'kanban' ? 'List' : 'Kanban'}</span>
          </Button>
          {viewMode === 'list' && (
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
        <span className="text-sm text-[#805c5c] text-center sm:text-right" style={{fontFamily: 'Montserrat'}}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* View Mode */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-[#805c5c]" style={{fontFamily: 'Montserrat'}}>Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-[#dbb4b4] p-8">
              <p className="text-[#323232] text-lg font-bold mb-2">Got too many things in your head?</p>
              <p className="text-[#805c5c]">Start dropping them here.</p>
            </div>
          ) : (
            items.map((item) => (
              <Link key={item.id} to={`/ItemDetail?id=${item.id}`}>
                <ItemCard
                  item={item}
                  ventures={ventures}
                  projects={projects}
                />
              </Link>
            ))
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
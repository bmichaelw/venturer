import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Filter, Grid3x3 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ItemCard from '../components/dump/ItemCard';
import ItemDetailPanel from '../components/dump/ItemDetailPanel';
import FilterBar from '../components/dump/FilterBar';
import KanbanCard from '../components/kanban/KanbanCard';
import AIRambleInput from '../components/ai/AIRambleInput';

const STATUSES = [
  { id: 'not_started', label: 'Not Started', color: 'bg-slate-100' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-100' },
  { id: 'canceled', label: 'Canceled', color: 'bg-red-100' },
];

export default function DumpPage() {
  const [quickAddValue, setQuickAddValue] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [filters, setFilters] = useState({
    venture_id: null,
    project_id: null,
    type: null,
    s_sextant: [],
    t_time: [],
    e_effort: [],
    p_priority: [],
  });
  const [sortBy, setSortBy] = useState('-created_date');
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch items
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const result = await base44.entities.Item.list();
      return result;
    },
  });

  // Filter and sort items on client side
  const items = React.useMemo(() => {
    let filtered = [...allItems];

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
    if (filters.s_sextant?.length > 0) {
      filtered = filtered.filter(item => filters.s_sextant.includes(item.s_sextant));
    }
    if (filters.t_time?.length > 0) {
      filtered = filtered.filter(item => filters.t_time.includes(item.t_time));
    }
    if (filters.e_effort?.length > 0) {
      filtered = filtered.filter(item => filters.e_effort.includes(item.e_effort));
    }
    if (filters.p_priority?.length > 0) {
      filtered = filtered.filter(item => filters.p_priority.includes(item.p_priority));
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
  }, [allItems, filters, sortBy]);

  // Fetch ventures for filters
  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.filter({ active: true }, 'name'),
  });

  // Fetch projects for filters
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', filters.venture_id],
    queryFn: async () => {
      if (!filters.venture_id) return [];
      return base44.entities.Project.filter({ venture_id: filters.venture_id }, 'name');
    },
    enabled: !!filters.venture_id,
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

      {/* AI Ramble Input */}
      <AIRambleInput ventures={ventures} />

      {/* Quick Add */}
      <form onSubmit={handleQuickAdd} className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6">
          <div className="flex gap-3">
            <Input
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              placeholder="Quick add (or use AI Brain Dump above for detailed capture)"
              className="flex-1 text-base border-0 bg-stone-50 focus-visible:ring-1 focus-visible:ring-[#14B8A6]"
            />
            <Button
              type="submit"
              disabled={!quickAddValue.trim() || createItemMutation.isPending}
              className="bg-[#14B8A6] hover:bg-[#0d9488] text-white px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </form>

      {/* Filter Toggle & Sort */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-slate-600"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
            className="text-slate-600"
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
        <span className="text-sm text-slate-500">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Filters */}
      {showFilters && (
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          ventures={ventures}
          projects={projects}
        />
      )}

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
    </div>
  );
}
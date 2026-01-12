import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Filter } from 'lucide-react';
import ItemCard from '../components/dump/ItemCard';
import ItemDetailPanel from '../components/dump/ItemDetailPanel';
import FilterBar from '../components/dump/FilterBar';

export default function DumpPage() {
  const [quickAddValue, setQuickAddValue] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
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

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">DUMP</h1>
        <p className="text-slate-600">Your brain dump zone. Capture everything, structure it later.</p>
      </div>

      {/* Quick Add */}
      <form onSubmit={handleQuickAdd} className="mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/50 p-6">
          <div className="flex gap-3">
            <Input
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 text-base border-0 bg-stone-50 focus-visible:ring-1 focus-visible:ring-amber-500"
            />
            <Button
              type="submit"
              disabled={!quickAddValue.trim() || createItemMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6"
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

      {/* Items List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-2">No items yet</p>
            <p className="text-sm text-slate-400">Start by adding something above</p>
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
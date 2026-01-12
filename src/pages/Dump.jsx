import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  });
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', filters],
    queryFn: async () => {
      const query = {};
      if (filters.venture_id) query.venture_id = filters.venture_id;
      if (filters.project_id) query.project_id = filters.project_id;
      if (filters.type) query.type = filters.type;
      
      const result = await base44.entities.Item.filter(query, '-created_date');
      return result;
    },
  });

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

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="text-slate-600"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
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
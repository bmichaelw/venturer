import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Bookmark, Trash2 } from 'lucide-react';

export default function SavedFiltersModal({ isOpen, onClose, currentFilters, onApplyFilter }) {
  const [filterName, setFilterName] = useState('');
  const queryClient = useQueryClient();

  const { data: savedFilters = [] } = useQuery({
    queryKey: ['savedFilters'],
    queryFn: () => base44.entities.SavedFilter.list(),
  });

  const saveFilterMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedFilter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedFilters'] });
      setFilterName('');
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedFilter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedFilters'] });
    },
  });

  const handleSave = () => {
    if (!filterName.trim()) return;
    saveFilterMutation.mutate({
      name: filterName,
      filters: currentFilters,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white">Saved Filters</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Save Current Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Save Current Filter</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Filter name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button 
                onClick={handleSave}
                disabled={!filterName.trim() || saveFilterMutation.isPending}
                className="bg-[#3B82F6] hover:bg-[#2563EB]"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Saved Filters List */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Saved Filters</Label>
            {savedFilters.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                No saved filters yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <button
                      onClick={() => {
                        onApplyFilter(filter.filters);
                        onClose();
                      }}
                      className="flex-1 text-left text-sm font-medium text-[#0F172A] dark:text-white"
                    >
                      {filter.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFilterMutation.mutate(filter.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
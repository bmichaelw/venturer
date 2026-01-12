import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, SlidersHorizontal } from 'lucide-react';

export default function GlobalSearchBar({ value, onChange, onClear, onToggleFilters, showFilters }) {
  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search items, comments, assignees..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10 h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <Button
        variant={showFilters ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleFilters}
        className={showFilters ? 'bg-[#3B82F6] hover:bg-[#2563EB]' : ''}
      >
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        Filters
      </Button>
    </div>
  );
}
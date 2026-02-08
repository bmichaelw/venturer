import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, ChevronRight, Layers } from 'lucide-react';

export default function TemplateSelector({ onSelect, onSkip }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['projectTemplates'],
    queryFn: () => base44.entities.ProjectTemplate.list('-created_date'),
  });

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryColors = {
    marketing: 'bg-purple-100 text-purple-700',
    product: 'bg-blue-100 text-blue-700',
    operations: 'bg-green-100 text-green-700',
    sales: 'bg-orange-100 text-orange-700',
    business: 'bg-slate-100 text-slate-700',
    creative: 'bg-pink-100 text-pink-700',
    education: 'bg-amber-100 text-amber-700',
    other: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Use a Template?</h3>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="pl-10"
        />
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No templates found</p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const totalTasks = template.milestones?.reduce((sum, m) => sum + (m.tasks?.length || 0), 0) || 0;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="w-full text-left border border-stone-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={categoryColors[template.category] || categoryColors.other}>
                      {template.category}
                    </Badge>
                    {template.is_public && (
                      <Badge variant="outline" className="text-xs">Public</Badge>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <h4 className="font-semibold text-slate-900">{template.name}</h4>
                </div>
                {template.description && (
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">{template.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{totalTasks} tasks</span>
                  <span>{template.milestones?.length || 0} milestones</span>
                  {template.estimated_duration_days && (
                    <span>{template.estimated_duration_days} days</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
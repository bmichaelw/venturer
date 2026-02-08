import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, FileText, Search, Tag } from 'lucide-react';
import ProjectTemplateModal from '../components/teams/ProjectTemplateModal';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teamMemberships = [] } = useQuery({
    queryKey: ['teamMemberships', currentUser?.email],
    queryFn: () => base44.entities.TeamMember.filter({ user_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });

  const userTeamIds = teamMemberships.map(tm => tm.team_id);

  const { data: templates = [] } = useQuery({
    queryKey: ['projectTemplates'],
    queryFn: async () => {
      const allTemplates = await base44.entities.ProjectTemplate.list('-created_date');
      return allTemplates.filter(t => userTeamIds.includes(t.team_id));
    },
    enabled: userTeamIds.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success('Template deleted');
    },
  });

  const handleDelete = (template) => {
    if (confirm(`Delete template "${template.name}"?`)) {
      deleteMutation.mutate(template.id);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.project_type === filterType;
    return matchesSearch && matchesType;
  });

  const projectTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'general', label: 'General' },
    { value: 'product_launch', label: 'Product Launch' },
    { value: 'marketing_campaign', label: 'Marketing' },
    { value: 'software_development', label: 'Software' },
    { value: 'event', label: 'Event' },
    { value: 'research', label: 'Research' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#323232]">Project Templates</h1>
          <p className="text-sm text-[#805c5c] mt-1">
            Create reusable project structures with pre-defined tasks
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTemplate(null);
            setShowModal(true);
          }}
          className="bg-[#223947] hover:bg-[#223947]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200/50 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-9"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-stone-200 rounded-md text-sm h-10"
          >
            {projectTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200/50 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-2">
            {searchQuery || filterType !== 'all' ? 'No templates match your search' : 'No templates yet'}
          </p>
          <p className="text-sm text-slate-500">
            {searchQuery || filterType !== 'all' ? 'Try adjusting your filters' : 'Create your first template to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-stone-200/50 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {template.project_type?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTemplate(template);
                      setShowModal(true);
                    }}
                    className="h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                <span>{template.estimated_duration_days} days</span>
                <span>•</span>
                <span>{template.subtasks?.length || 0} tasks</span>
              </div>

              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Template Modal */}
      {showModal && userTeamIds.length > 0 && (
        <ProjectTemplateModal
          teamId={userTeamIds[0]}
          template={editingTemplate}
          onClose={() => {
            setShowModal(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}
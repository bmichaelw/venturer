import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bookmark, X } from 'lucide-react';
import { toast } from 'sonner';

export default function SaveAsTemplateModal({ onClose }) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('other');
  const queryClient = useQueryClient();

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.list('name'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('name'),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
    enabled: !!selectedProjectId,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.ProjectTemplate.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success('Template created successfully');
      onClose();
    },
  });

  const handleSave = () => {
    if (!selectedProjectId || !templateName) {
      toast.error('Please fill in all required fields');
      return;
    }

    const project = projects.find(p => p.id === selectedProjectId);
    const projectItems = items.filter(i => i.project_id === selectedProjectId && i.type === 'task');

    const tasks = projectItems.map(item => ({
      title: item.title,
      description: item.description || '',
      status: item.status || 'not_started',
      days_offset: 0,
      estimated_time_minutes: item.estimated_time_minutes,
      s_sextant: item.s_sextant,
      t_time: item.t_time,
      e_effort: item.e_effort,
      p_priority: item.p_priority,
    }));

    createTemplateMutation.mutate({
      name: templateName,
      description: project?.description || '',
      category: category,
      is_public: false,
      tasks: tasks,
      milestones: [],
    });
  };

  const projectsByVenture = ventures.map(v => ({
    venture: v,
    projects: projects.filter(p => p.venture_id === v.id),
  })).filter(g => g.projects.length > 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(34,57,71,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 20,
      }}
      className="fade-in"
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: 18,
          padding: 32,
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 20px 60px rgba(34,57,71,0.2)",
        }}
        onClick={e => e.stopPropagation()}
        className="fade-up"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#223947",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Bookmark className="w-5 h-5" style={{ color: "#fffbf6" }} />
            </div>
            <div>
              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: "#223947",
              }}>
                Save as Template
              </h2>
              <p style={{ fontSize: 12, color: "#805c5c" }}>
                Snapshot a project's structure
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <Label htmlFor="project" style={{ marginBottom: 6, display: "block" }}>
              Source Project *
            </Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {projectsByVenture.map(group => (
                  <div key={group.venture.id}>
                    <div style={{
                      padding: "6px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#805c5c",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {group.venture.name}
                    </div>
                    {group.projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name" style={{ marginBottom: 6, display: "block" }}>
              Template Name *
            </Label>
            <Input
              id="name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., My Website Launch Process"
            />
          </div>

          <div>
            <Label htmlFor="category" style={{ marginBottom: 6, display: "block" }}>
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p style={{
            fontSize: 11,
            color: "#999",
            lineHeight: 1.5,
            padding: "10px 14px",
            background: "#fffbf6",
            borderRadius: 8,
          }}>
            This will save the project's tasks, descriptions, and STEP values as a reusable template. No dates or personal data are included.
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="outline"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createTemplateMutation.isPending || !selectedProjectId || !templateName}
              style={{
                flex: 1,
                background: "#223947",
                color: "#fffbf6",
              }}
            >
              {createTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
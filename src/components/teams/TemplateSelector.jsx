import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateSelector({ teamId, ventureId, projectName, projectDescription, onComplete }) {
  const [selectedTemplate, setSelectedTemplate] = useState('none');
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['projectTemplates', teamId],
    queryFn: () => base44.entities.ProjectTemplate.filter({ team_id: teamId }),
    enabled: !!teamId,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (templateId) => {
      // Create project
      const project = await base44.entities.Project.create({
        venture_id: ventureId,
        name: projectName,
        description: projectDescription,
        status: 'active',
      });

      // If template selected, create subtasks
      if (templateId && templateId !== 'none') {
        const template = templates.find(t => t.id === templateId);
        if (template && template.subtasks && template.subtasks.length > 0) {
          const startDate = new Date();
          let cumulativeDays = 0;
          
          await base44.entities.Item.bulkCreate(
            template.subtasks.map((subtask) => {
              const dueDate = new Date(startDate.getTime() + cumulativeDays * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];
              cumulativeDays += subtask.estimated_days || 5;
              
              return {
                title: subtask.title,
                description: subtask.description || '',
                type: 'task',
                project_id: project.id,
                venture_id: ventureId,
                status: 'not_started',
                due_date: dueDate,
                t_time: subtask.t_time || (subtask.estimated_days > 10 ? 3 : subtask.estimated_days > 5 ? 2 : 1),
                e_effort: subtask.e_effort || null,
                p_priority: subtask.p_priority || null,
                s_sextant: subtask.s_sextant || null,
              };
            })
          );
        }
      }

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Project created' + (selectedTemplate !== 'none' ? ' with template' : ''));
      onComplete(project);
    },
  });

  const handleCreate = () => {
    createProjectMutation.mutate(selectedTemplate);
  };

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div>
        <Label className="text-sm font-semibold text-slate-900">
          Use Project Template (Optional)
        </Label>
        <p className="text-xs text-slate-600 mt-1">
          Select a template to auto-populate sub-tasks and timelines
        </p>
      </div>

      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
        <SelectTrigger>
          <SelectValue placeholder="No template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Template</SelectItem>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
              {template.subtasks && ` (${template.subtasks.length} tasks)`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTemplate !== 'none' && templates.find(t => t.id === selectedTemplate) && (
        <div className="p-3 bg-white rounded-lg border border-blue-100 space-y-2">
          <p className="text-xs font-semibold text-slate-900">
            This template includes:
          </p>
          {templates.find(t => t.id === selectedTemplate)?.description && (
            <p className="text-xs text-slate-600 italic">
              {templates.find(t => t.id === selectedTemplate).description}
            </p>
          )}
          <ul className="text-xs text-slate-600 space-y-1 max-h-32 overflow-y-auto">
            {templates
              .find(t => t.id === selectedTemplate)
              ?.subtasks?.map((task, idx) => (
                <li key={idx} className="break-words">
                  • {task.title} ({task.estimated_days} days)
                  {task.assigned_role && ` - ${task.assigned_role}`}
                </li>
              ))}
          </ul>
        </div>
      )}

      <Button
        onClick={handleCreate}
        disabled={createProjectMutation.isPending || !projectName}
        className="w-full bg-blue-600 hover:bg-blue-700 h-11 sm:h-9"
      >
        {createProjectMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Project'
        )}
      </Button>
    </div>
  );
}
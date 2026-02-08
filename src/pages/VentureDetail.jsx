import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Folder, CheckCircle2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DocumentList from '../components/documents/DocumentList';
import AddItemModal from '../components/dump/AddItemModal';
import TemplateSelector from '../components/templates/TemplateSelector';
import { format, parseISO, addDays } from 'date-fns';

export default function VentureDetailPage() {
  const [searchParams] = useSearchParams();
  const ventureId = searchParams.get('id');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: venture } = useQuery({
    queryKey: ['venture', ventureId],
    queryFn: async () => {
      const ventures = await base44.entities.Venture.filter({ id: ventureId });
      return ventures[0];
    },
    enabled: !!ventureId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', ventureId],
    queryFn: () => base44.entities.Project.filter({ venture_id: ventureId }, 'name'),
    enabled: !!ventureId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items', ventureId],
    queryFn: () => base44.entities.Item.filter({ venture_id: ventureId }),
    enabled: !!ventureId,
  });



  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      const project = await base44.entities.Project.create(projectData);
      
      // If using template, create tasks and milestones
      if (selectedTemplate) {
        const today = new Date();
        
        // Create tasks from template
        if (selectedTemplate.tasks?.length > 0) {
          const taskPromises = selectedTemplate.tasks.map((task) => {
            const dueDate = task.days_offset ? addDays(today, task.days_offset) : null;
            return base44.entities.Item.create({
              venture_id: ventureId,
              project_id: project.id,
              type: 'task',
              title: task.title,
              description: task.description || '',
              status: task.status || 'not_started',
              due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
              estimated_time_minutes: task.estimated_time_minutes,
              s_sextant: task.s_sextant,
              t_time: task.t_time,
              e_effort: task.e_effort,
              p_priority: task.p_priority,
            });
          });
          await Promise.all(taskPromises);
        }
        
        // Create milestone notes from template
        if (selectedTemplate.milestones?.length > 0) {
          const milestonePromises = selectedTemplate.milestones.map((milestone) => {
            const milestoneDate = milestone.days_offset ? addDays(today, milestone.days_offset) : null;
            return base44.entities.Item.create({
              venture_id: ventureId,
              project_id: project.id,
              type: 'note',
              title: `📍 ${milestone.title}`,
              description: milestone.description || '',
              due_date: milestoneDate ? format(milestoneDate, 'yyyy-MM-dd') : null,
            });
          });
          await Promise.all(milestonePromises);
        }
      }
      
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', ventureId] });
      queryClient.invalidateQueries({ queryKey: ['items', ventureId] });
      setShowProjectModal(false);
      setShowTemplateSelector(false);
      setSelectedTemplate(null);
      setProjectName('');
      setProjectDescription('');
    },
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    createProjectMutation.mutate({
      venture_id: ventureId,
      name: projectName,
      description: projectDescription,
      status: selectedTemplate?.default_status || 'active',
    });
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setProjectName(template.name);
    setProjectDescription(template.description || '');
    setShowTemplateSelector(false);
  };

  const handleOpenProjectModal = () => {
    setShowTemplateSelector(true);
    setShowProjectModal(true);
  };

  if (!venture) {
    return <div className="text-center py-12">Loading venture...</div>;
  }

  const tasks = items.filter(i => i.type === 'task');
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/Ventures" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Ventures
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200/50 p-4 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div 
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: venture.color }}
            >
              <span className="text-xl sm:text-2xl text-white font-bold">
                {venture.name[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-[#323232] mb-2" style={{fontFamily: 'Acherus Grotesque'}}>{venture.name}</h1>
              {venture.description && (
                <p className="text-[#805c5c]" style={{fontFamily: 'Montserrat'}}>{venture.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
          <div className="text-center p-3 sm:p-4 bg-stone-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{projects.length}</div>
            <div className="text-xs sm:text-sm text-slate-600">Projects</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-stone-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{items.length}</div>
            <div className="text-xs sm:text-sm text-slate-600">Total Items</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-stone-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
            </div>
            <div className="text-xs sm:text-sm text-slate-600">Completion</div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="border-t border-stone-200 pt-6">
          <DocumentList entityType="venture" entityId={ventureId} />
        </div>
      </div>

      {/* Quick Add */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Quick Add</h2>
          <Button onClick={() => setShowAddItemModal(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Note/Idea/Task
          </Button>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Tasks</h2>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No tasks in this venture yet
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <Link
                key={task.id}
                to={`/ItemDetail?id=${task.id}`}
                className="block border border-stone-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-slate-500 mt-2">
                          Due: {format(parseISO(task.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Projects</h2>
          <Button onClick={handleOpenProjectModal} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No projects in this venture yet
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(project => {
              const projectItems = items.filter(i => i.project_id === project.id);
              const projectTasks = projectItems.filter(i => i.type === 'task');
              const completed = projectTasks.filter(t => t.status === 'completed').length;

              return (
                <Link
                  key={project.id}
                  to={`/ProjectDetail?id=${project.id}`}
                  className="block border border-stone-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-slate-500" />
                      <div>
                        <h3 className="font-semibold text-slate-900">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={project.status === 'completed' ? 'default' : 'outline'}>
                        {project.status}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        {completed}/{projectTasks.length} tasks
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <Dialog open={showProjectModal} onOpenChange={(open) => {
        setShowProjectModal(open);
        if (!open) {
          setShowTemplateSelector(false);
          setSelectedTemplate(null);
          setProjectName('');
          setProjectDescription('');
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>
          
          {showTemplateSelector ? (
            <TemplateSelector
              onSelect={handleTemplateSelect}
              onSkip={() => setShowTemplateSelector(false)}
            />
          ) : (
            <form onSubmit={handleCreateProject} className="space-y-4">
              {selectedTemplate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    Using template: <strong>{selectedTemplate.name}</strong>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This will create {selectedTemplate.tasks?.length || 0} tasks and {selectedTemplate.milestones?.length || 0} milestones
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setShowTemplateSelector(true);
                    }}
                    className="mt-2 h-7 text-xs"
                  >
                    Choose Different Template
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description (optional)</Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowProjectModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <AddItemModal 
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        ventureId={ventureId}
      />
    </div>
  );
}
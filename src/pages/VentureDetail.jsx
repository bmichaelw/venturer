import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Folder } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DocumentList from '../components/documents/DocumentList';
import AddItemModal from '../components/dump/AddItemModal';

export default function VentureDetailPage() {
  const [searchParams] = useSearchParams();
  const ventureId = searchParams.get('id');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
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
    mutationFn: (projectData) => base44.entities.Project.create(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', ventureId] });
      setShowProjectModal(false);
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
    });
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

      <div className="bg-white rounded-2xl border border-stone-200/50 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: venture.color }}
            >
              <span className="text-2xl text-white font-bold">
                {venture.name[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{venture.name}</h1>
              {venture.description && (
                <p className="text-slate-600">{venture.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-stone-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">{projects.length}</div>
            <div className="text-sm text-slate-600">Projects</div>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">{items.length}</div>
            <div className="text-sm text-slate-600">Total Items</div>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">
              {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
            </div>
            <div className="text-sm text-slate-600">Completion</div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="border-t border-stone-200 pt-6">
          <DocumentList entityType="venture" entityId={ventureId} />
        </div>
      </div>

      {/* Quick Add */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Quick Add</h2>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddItemModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Note/Idea/Task
            </Button>
            <Link to="/Dump">
              <Button variant="outline">View All Tasks</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Projects</h2>
          <Button onClick={() => setShowProjectModal(true)} size="sm">
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
      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
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
import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Clock, Plus, BarChart3, Calendar as CalendarIcon, Sparkles, Trash2, Target, Layers } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '../utils';
import DocumentList from '../components/documents/DocumentList';
import AddItemModal from '../components/dump/AddItemModal';
import ProjectGanttChart from '../components/projects/ProjectGanttChart';
import ProjectMetricsWidget from '../components/projects/ProjectMetricsWidget';
import ProjectTaskFilters from '../components/projects/ProjectTaskFilters';
import MilestoneCard from '../components/milestones/MilestoneCard';
import MilestoneModal from '../components/milestones/MilestoneModal';
import WorkstreamCard from '../components/workstreams/WorkstreamCard';
import WorkstreamModal from '../components/workstreams/WorkstreamModal';
import { format, parseISO } from 'date-fns';

export default function ProjectDetailPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showWorkstreamModal, setShowWorkstreamModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editingWorkstream, setEditingWorkstream] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      // Delete all items in this project
      const items = await base44.entities.Item.filter({ project_id: projectId });
      await Promise.all(items.map(item => base44.entities.Item.delete(item.id)));
      // Delete the project
      await base44.entities.Project.delete(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (venture) {
        navigate(`/VentureDetail?id=${venture.id}`);
      } else {
        navigate('/Ventures');
      }
    },
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

  const { data: venture } = useQuery({
    queryKey: ['venture', project?.venture_id],
    queryFn: async () => {
      const ventures = await base44.entities.Venture.filter({ id: project.venture_id });
      return ventures[0];
    },
    enabled: !!project?.venture_id,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items', projectId],
    queryFn: () => base44.entities.Item.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => base44.entities.Milestone.filter({ project_id: projectId }, 'order'),
    enabled: !!projectId,
  });

  const { data: workstreams = [] } = useQuery({
    queryKey: ['workstreams', projectId],
    queryFn: () => base44.entities.Workstream.filter({ project_id: projectId }, 'order'),
    enabled: !!projectId,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const tasks = items.filter(i => i.type === 'task');
  
  // Get unique assignees for filter dropdown
  const assignees = useMemo(() => {
    return [...new Set(tasks.filter(t => t.assigned_to).map(t => t.assigned_to))];
  }, [tasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.assignee) {
        if (filters.assignee === 'unassigned' && task.assigned_to) return false;
        if (filters.assignee !== 'unassigned' && task.assigned_to !== filters.assignee) return false;
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return task.title?.toLowerCase().includes(search) || 
               task.description?.toLowerCase().includes(search);
      }
      return true;
    });
  }, [tasks, filters]);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  const saveMilestoneMutation = useMutation({
    mutationFn: async (data) => {
      if (editingMilestone) {
        return base44.entities.Milestone.update(editingMilestone.id, data);
      }
      return base44.entities.Milestone.create({ ...data, project_id: projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      setShowMilestoneModal(false);
      setEditingMilestone(null);
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (milestoneId) => {
      await base44.entities.Milestone.delete(milestoneId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });

  const saveWorkstreamMutation = useMutation({
    mutationFn: async (data) => {
      if (editingWorkstream) {
        return base44.entities.Workstream.update(editingWorkstream.id, data);
      }
      return base44.entities.Workstream.create({ ...data, project_id: projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstreams'] });
      setShowWorkstreamModal(false);
      setEditingWorkstream(null);
    },
  });

  const deleteWorkstreamMutation = useMutation({
    mutationFn: async (workstreamId) => {
      await base44.entities.Workstream.delete(workstreamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstreams'] });
    },
  });

  const getItemCountForMilestone = (milestoneId) => {
    return items.filter(i => i.milestone_id === milestoneId).length;
  };

  const getItemCountForWorkstream = (workstreamId) => {
    return items.filter(i => i.workstream_id === workstreamId).length;
  };

  if (!project) {
    return <div className="text-center py-12">Loading project...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link to={createPageUrl('VentureDetail') + '?id=' + project.venture_id} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Venture
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200/50 p-4 sm:p-8 mb-6">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              {venture && (
                <Badge 
                  className="mb-3"
                  style={{ backgroundColor: venture.color, color: 'white' }}
                >
                  {venture.name}
                </Badge>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-sm sm:text-base text-slate-600">{project.description}</p>
              )}
              <Badge variant={project.status === 'completed' ? 'default' : 'outline'} className="mt-3">
                {project.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl('ProjectBuilder') + '?projectId=' + projectId}>
                <Button variant="outline" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Expand</span>
                </Button>
              </Link>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  if (confirm(`Delete project "${project.name}"? This will also delete all its tasks.`)) {
                    deleteProjectMutation.mutate();
                  }
                }}
                disabled={deleteProjectMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Widgets */}
        <ProjectMetricsWidget tasks={tasks} project={project} />

        {/* Project Rundown Section */}
        <div className="border-t border-stone-200 pt-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Project Rundown Document</h3>
              <p className="text-sm text-slate-600">
                Upload your project rundown for AI-powered insights and task generation.
              </p>
              <p className="text-xs text-amber-600 mt-1 font-medium">
                ⚠️ PDF format required for AI interpretation
              </p>
            </div>
          </div>
          <DocumentList entityType="project" entityId={projectId} />
        </div>

        {/* Additional Documents */}
        <div className="border-t border-stone-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Documents</h3>
          <DocumentList entityType="project" entityId={projectId} />
        </div>
      </div>

      {/* Milestones & Workstreams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Milestones */}
        <div className="bg-white rounded-2xl border border-stone-200/50 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Milestones
            </h2>
            <Button size="sm" onClick={() => setShowMilestoneModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
          <div className="space-y-3">
            {milestones.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No milestones yet</p>
            ) : (
              milestones.map(milestone => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  itemCount={getItemCountForMilestone(milestone.id)}
                  onEdit={() => {
                    setEditingMilestone(milestone);
                    setShowMilestoneModal(true);
                  }}
                  onDelete={() => {
                    if (confirm('Delete this milestone?')) {
                      deleteMilestoneMutation.mutate(milestone.id);
                    }
                  }}
                  onClick={() => {}}
                />
              ))
            )}
          </div>
        </div>

        {/* Workstreams */}
        <div className="bg-white rounded-2xl border border-stone-200/50 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Workstreams
            </h2>
            <Button size="sm" onClick={() => setShowWorkstreamModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
          <div className="space-y-3">
            {workstreams.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No workstreams yet</p>
            ) : (
              workstreams.map(workstream => (
                <WorkstreamCard
                  key={workstream.id}
                  workstream={workstream}
                  itemCount={getItemCountForWorkstream(workstream.id)}
                  onEdit={() => {
                    setEditingWorkstream(workstream);
                    setShowWorkstreamModal(true);
                  }}
                  onDelete={() => {
                    if (confirm('Delete this workstream?')) {
                      deleteWorkstreamMutation.mutate(workstream.id);
                    }
                  }}
                  onClick={() => {}}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-slate-900">Tasks</h2>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowAddItemModal(true)} className="flex-1 sm:flex-initial">
              <Plus className="w-4 h-4 mr-2" />
              <span>Add Task</span>
            </Button>
            <Link to="/Dump" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full">
                View All Tasks
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list" className="text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">List View</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs sm:text-sm">
              <CalendarIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Metrics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* Filters */}
            <ProjectTaskFilters 
              filters={filters}
              onFiltersChange={setFilters}
              assignees={assignees}
            />

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {tasks.length === 0 ? 'No tasks in this project yet' : 'No tasks match your filters'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="border border-stone-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
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
                          <div className="flex items-center gap-3 mt-2">
                            {task.due_date && (
                              <p className="text-xs text-slate-500">
                                Due: {format(parseISO(task.due_date), 'MMM d, yyyy')}
                              </p>
                            )}
                            {task.assigned_to && (
                              <Badge variant="outline" className="text-xs">
                                {task.assigned_to}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <ProjectGanttChart tasks={tasks} startDate={project.created_date} />
          </TabsContent>

          <TabsContent value="metrics">
            <ProjectMetricsWidget tasks={tasks} project={project} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Item Modal */}
      <AddItemModal 
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        ventureId={project.venture_id}
        projectId={projectId}
      />

      {/* Milestone Modal */}
      <MilestoneModal
        open={showMilestoneModal}
        onClose={() => {
          setShowMilestoneModal(false);
          setEditingMilestone(null);
        }}
        onSave={(data) => saveMilestoneMutation.mutate(data)}
        milestone={editingMilestone}
      />

      {/* Workstream Modal */}
      <WorkstreamModal
        open={showWorkstreamModal}
        onClose={() => {
          setShowWorkstreamModal(false);
          setEditingWorkstream(null);
        }}
        onSave={(data) => saveWorkstreamMutation.mutate(data)}
        workstream={editingWorkstream}
        users={allUsers}
      />
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Clock, Plus, BarChart3, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '../utils';
import DocumentList from '../components/documents/DocumentList';
import AddItemModal from '../components/dump/AddItemModal';
import ProjectGanttChart from '../components/projects/ProjectGanttChart';
import ProjectMetricsWidget from '../components/projects/ProjectMetricsWidget';
import ProjectTaskFilters from '../components/projects/ProjectTaskFilters';
import { format, parseISO } from 'date-fns';

export default function ProjectDetailPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('list');

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

  if (!project) {
    return <div className="text-center py-12">Loading project...</div>;
  }

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
            <Link to={createPageUrl('ProjectBuilder') + '?projectId=' + projectId}>
              <Button variant="outline" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Expand Project</span>
                <span className="xs:hidden">Expand</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Widgets */}
        <ProjectMetricsWidget tasks={tasks} project={project} />

        {/* Documents Section */}
        <div className="border-t border-stone-200 pt-6">
          <DocumentList entityType="project" entityId={projectId} />
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
    </div>
  );
}
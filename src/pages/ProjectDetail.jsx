import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { createPageUrl } from '../utils';
import DocumentList from '../components/documents/DocumentList';
import { format, parseISO } from 'date-fns';

export default function ProjectDetailPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');

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
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div className="max-w-5xl mx-auto">
      <Link to={createPageUrl('VentureDetail') + '?id=' + project.venture_id} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Venture
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200/50 p-8 mb-6">
        <div className="mb-6">
          {venture && (
            <Badge 
              className="mb-3"
              style={{ backgroundColor: venture.color, color: 'white' }}
            >
              {venture.name}
            </Badge>
          )}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-slate-600">{project.description}</p>
          )}
          <Badge variant={project.status === 'completed' ? 'default' : 'outline'} className="mt-3">
            {project.status}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-stone-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">{tasks.length}</div>
            <div className="text-sm text-slate-600">Total Tasks</div>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">{completedTasks}</div>
            <div className="text-sm text-slate-600">Completed</div>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">{inProgressTasks}</div>
            <div className="text-sm text-slate-600">In Progress</div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="border-t border-stone-200 pt-6">
          <DocumentList entityType="project" entityId={projectId} />
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Tasks</h2>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No tasks in this project yet
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
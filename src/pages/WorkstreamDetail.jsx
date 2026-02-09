import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@antml:function_calls';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import WorkstreamModal from '../components/workstreams/WorkstreamModal';
import AssociationManager from '../components/associations/AssociationManager';
import { useNavigate } from 'react-router-dom';

export default function WorkstreamDetailPage() {
  const [searchParams] = useSearchParams();
  const workstreamId = searchParams.get('id');
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: workstream } = useQuery({
    queryKey: ['workstream', workstreamId],
    queryFn: async () => {
      const workstreams = await base44.entities.Workstream.filter({ id: workstreamId });
      return workstreams[0];
    },
    enabled: !!workstreamId,
  });

  const { data: project } = useQuery({
    queryKey: ['project', workstream?.project_id],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: workstream.project_id });
      return projects[0];
    },
    enabled: !!workstream?.project_id,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items', workstreamId],
    queryFn: () => base44.entities.Item.filter({ workstream_id: workstreamId }),
    enabled: !!workstreamId,
  });

  const updateWorkstreamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Workstream.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstream'] });
      queryClient.invalidateQueries({ queryKey: ['workstreams'] });
      setShowEditModal(false);
      toast.success('Workstream updated');
    },
  });

  const deleteWorkstreamMutation = useMutation({
    mutationFn: (id) => base44.entities.Workstream.delete(id),
    onSuccess: () => {
      toast.success('Workstream deleted');
      navigate(`/ProjectDetail?id=${workstream.project_id}`);
    },
  });

  const handleSave = (data) => {
    updateWorkstreamMutation.mutate({ id: workstreamId, data });
  };

  const handleDelete = () => {
    if (confirm('Delete this workstream? Associated items will not be deleted.')) {
      deleteWorkstreamMutation.mutate(workstreamId);
    }
  };

  if (!workstream) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-slate-100 text-slate-800',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link to={`/ProjectDetail?id=${workstream.project_id}`} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Project
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200/50 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: workstream.color }}
              />
              <h1 className="text-3xl font-bold text-slate-900">{workstream.title}</h1>
              <Badge className={statusColors[workstream.status]}>
                {workstream.status}
              </Badge>
            </div>
            {project && (
              <p className="text-slate-600">Project: {project.name}</p>
            )}
            {workstream.owner && (
              <p className="text-sm text-slate-500 mt-1">Owner: {workstream.owner}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {workstream.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{workstream.description}</p>
          </div>
        )}

        <div className="border-t border-stone-200 pt-6">
          <AssociationManager
            entityType="workstream"
            entityId={workstreamId}
            entityTitle={workstream.title}
          />
        </div>
      </div>

      {/* Associated Items */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Associated Items ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-slate-500">No items associated with this workstream</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <Link
                key={item.id}
                to={`/ItemDetail?id=${item.id}`}
                className="block border border-stone-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <h3 className="font-medium text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-600">{item.type}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{item.status.replace('_', ' ')}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <WorkstreamModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSave}
        workstream={workstream}
      />
    </div>
  );
}
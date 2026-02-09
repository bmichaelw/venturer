import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import MilestoneModal from '../components/milestones/MilestoneModal';
import AssociationManager from '../components/associations/AssociationManager';
import { useNavigate } from 'react-router-dom';

export default function MilestoneDetailPage() {
  const [searchParams] = useSearchParams();
  const milestoneId = searchParams.get('id');
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: milestone } = useQuery({
    queryKey: ['milestone', milestoneId],
    queryFn: async () => {
      const milestones = await base44.entities.Milestone.filter({ id: milestoneId });
      return milestones[0];
    },
    enabled: !!milestoneId,
  });

  const { data: project } = useQuery({
    queryKey: ['project', milestone?.project_id],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: milestone.project_id });
      return projects[0];
    },
    enabled: !!milestone?.project_id,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items', milestoneId],
    queryFn: () => base44.entities.Item.filter({ milestone_id: milestoneId }),
    enabled: !!milestoneId,
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Milestone.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestone'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      setShowEditModal(false);
      toast.success('Milestone updated');
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id) => base44.entities.Milestone.delete(id),
    onSuccess: () => {
      toast.success('Milestone deleted');
      navigate(`/ProjectDetail?id=${milestone.project_id}`);
    },
  });

  const handleSave = (data) => {
    updateMilestoneMutation.mutate({ id: milestoneId, data });
  };

  const handleDelete = () => {
    if (confirm('Delete this milestone? Associated items will not be deleted.')) {
      deleteMilestoneMutation.mutate(milestoneId);
    }
  };

  if (!milestone) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const statusColors = {
    not_started: 'bg-slate-100 text-slate-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link to={`/ProjectDetail?id=${milestone.project_id}`} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Project
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200/50 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-slate-900">{milestone.title}</h1>
              <Badge className={statusColors[milestone.status]}>
                {milestone.status.replace('_', ' ')}
              </Badge>
            </div>
            {project && (
              <p className="text-slate-600">Project: {project.name}</p>
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

        {milestone.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{milestone.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {milestone.start_date && (
            <div>
              <p className="text-sm text-slate-600">Start Date</p>
              <p className="font-medium">{format(parseISO(milestone.start_date), 'MMM d, yyyy')}</p>
            </div>
          )}
          {milestone.end_date && (
            <div>
              <p className="text-sm text-slate-600">End Date</p>
              <p className="font-medium">{format(parseISO(milestone.end_date), 'MMM d, yyyy')}</p>
            </div>
          )}
        </div>

        <div className="border-t border-stone-200 pt-6">
          <AssociationManager
            entityType="milestone"
            entityId={milestoneId}
            entityTitle={milestone.title}
          />
        </div>
      </div>

      {/* Associated Items */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Associated Items ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-slate-500">No items associated with this milestone</p>
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

      <MilestoneModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSave}
        milestone={milestone}
      />
    </div>
  );
}
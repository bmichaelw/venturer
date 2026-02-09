import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X, Link2, ArrowRight, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const RELATIONSHIP_TYPES = [
  { value: 'blocks', label: '🚫 Blocks', color: 'bg-red-100 text-red-800' },
  { value: 'blocked_by', label: '⛔ Blocked By', color: 'bg-red-100 text-red-800' },
  { value: 'depends_on', label: '🔗 Depends On', color: 'bg-blue-100 text-blue-800' },
  { value: 'aids', label: '🤝 Aids', color: 'bg-green-100 text-green-800' },
  { value: 'aided_by', label: '✨ Aided By', color: 'bg-green-100 text-green-800' },
  { value: 'relates_to', label: '↔️ Relates To', color: 'bg-gray-100 text-gray-800' },
  { value: 'parent_of', label: '👆 Parent Of', color: 'bg-purple-100 text-purple-800' },
  { value: 'child_of', label: '👇 Child Of', color: 'bg-purple-100 text-purple-800' },
];

export default function AssociationManager({ entityType, entityId, entityTitle }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('item');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [relationshipType, setRelationshipType] = useState('relates_to');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch associations
  const { data: associations = [] } = useQuery({
    queryKey: ['associations', entityType, entityId],
    queryFn: async () => {
      const outgoing = await base44.entities.Association.filter({
        from_entity_type: entityType,
        from_entity_id: entityId
      });
      const incoming = await base44.entities.Association.filter({
        to_entity_type: entityType,
        to_entity_id: entityId
      });
      return [...outgoing, ...incoming];
    },
    enabled: !!entityId,
  });

  // Fetch items for search
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list(),
  });

  const { data: workstreams = [] } = useQuery({
    queryKey: ['workstreams'],
    queryFn: () => base44.entities.Workstream.list(),
  });

  // Create association
  const createAssociationMutation = useMutation({
    mutationFn: (data) => base44.entities.Association.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associations'] });
      setShowAddDialog(false);
      setSearchQuery('');
      setSelectedEntityId('');
      setNotes('');
      toast.success('Association created');
    },
  });

  // Delete association
  const deleteAssociationMutation = useMutation({
    mutationFn: (id) => base44.entities.Association.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associations'] });
      toast.success('Association removed');
    },
  });

  const handleCreate = () => {
    if (!selectedEntityId) return;
    createAssociationMutation.mutate({
      from_entity_type: entityType,
      from_entity_id: entityId,
      to_entity_type: selectedEntityType,
      to_entity_id: selectedEntityId,
      relationship_type: relationshipType,
      notes: notes,
    });
  };

  // Get all entities for search
  const allEntities = [
    ...items.map(i => ({ ...i, _type: 'item', _title: i.title })),
    ...milestones.map(m => ({ ...m, _type: 'milestone', _title: m.title })),
    ...workstreams.map(w => ({ ...w, _type: 'workstream', _title: w.title })),
  ].filter(e => !(e._type === entityType && e.id === entityId));

  const filteredEntities = allEntities.filter(e => 
    selectedEntityType === e._type &&
    e._title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEntityTitle = (type, id) => {
    const entity = allEntities.find(e => e._type === type && e.id === id);
    return entity?._title || 'Unknown';
  };

  const getRelationshipConfig = (type) => {
    return RELATIONSHIP_TYPES.find(r => r.value === type) || RELATIONSHIP_TYPES[0];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Associations</h3>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Association
        </Button>
      </div>

      {associations.length === 0 ? (
        <p className="text-sm text-slate-500">No associations yet</p>
      ) : (
        <div className="space-y-2">
          {associations.map(assoc => {
            const isOutgoing = assoc.from_entity_type === entityType && assoc.from_entity_id === entityId;
            const relatedType = isOutgoing ? assoc.to_entity_type : assoc.from_entity_type;
            const relatedId = isOutgoing ? assoc.to_entity_id : assoc.from_entity_id;
            const relatedTitle = getEntityTitle(relatedType, relatedId);
            const relConfig = getRelationshipConfig(assoc.relationship_type);

            return (
              <div key={assoc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                <Link 
                  to={`/${relatedType === 'item' ? 'ItemDetail' : relatedType === 'milestone' ? 'MilestoneDetail' : 'WorkstreamDetail'}?id=${relatedId}`}
                  className="flex items-center gap-2 flex-1 hover:opacity-70 transition-opacity"
                >
                  <Badge variant="outline" className="text-xs">{relatedType}</Badge>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">{relatedTitle}</span>
                  <Badge className={`text-xs ${relConfig.color}`}>{relConfig.label}</Badge>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAssociationMutation.mutate(assoc.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Association</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="item">Task/Note/Idea</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="workstream">Workstream</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredEntities.map(entity => (
                <div
                  key={entity.id}
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={`p-2 border rounded cursor-pointer transition-colors ${
                    selectedEntityId === entity.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-medium">{entity._title}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Relationship Type</Label>
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add context about this relationship..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!selectedEntityId}>
                Create Association
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
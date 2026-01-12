import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format, parseISO } from 'date-fns';
import KanbanCard from '../components/kanban/KanbanCard';

const STATUSES = [
  { id: 'not_started', label: 'Not Started', color: 'bg-slate-100' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-100' },
  { id: 'canceled', label: 'Canceled', color: 'bg-red-100' },
];

export default function KanbanPage() {
  const [selectedVenture, setSelectedVenture] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ itemId, newStatus }) =>
      base44.entities.Item.update(itemId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => item.type === 'task');

    if (selectedVenture !== 'all') {
      filtered = filtered.filter(item => item.venture_id === selectedVenture);
    }

    if (selectedProject !== 'all') {
      filtered = filtered.filter(item => item.project_id === selectedProject);
    }

    return filtered;
  }, [items, selectedVenture, selectedProject]);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const newStatus = destination.droppableId;
    updateStatusMutation.mutate({ itemId: draggableId, newStatus });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Kanban Board</h1>
        <p className="text-slate-600">Drag tasks across columns to manage workflow</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={selectedVenture} onValueChange={setSelectedVenture}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Ventures" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ventures</SelectItem>
            {ventures.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedVenture !== 'all' && (
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.filter(p => p.venture_id === selectedVenture).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map((status) => {
            const statusItems = filteredItems.filter(item => item.status === status.id);

            return (
              <div
                key={status.id}
                className={`${status.color} rounded-xl border-2 border-dashed border-slate-300 p-4 min-h-[600px]`}
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900">{status.label}</h3>
                  <p className="text-xs text-slate-600 mt-1">{statusItems.length} tasks</p>
                </div>

                <Droppable droppableId={status.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-white/50 rounded-lg p-2' : ''
                      }`}
                    >
                      {statusItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-all ${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <KanbanCard item={item} ventures={ventures} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
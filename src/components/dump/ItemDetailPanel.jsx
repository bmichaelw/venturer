import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2, Plus, XCircle } from 'lucide-react';
import CommentSection from '../collaboration/CommentSection';
import DocumentList from '../documents/DocumentList';
import EnhancedTaskSuggestions from '../ai/EnhancedTaskSuggestions';
import ReminderPicker from '../reminders/ReminderPicker';

export default function ItemDetailPanel({ item, onClose, ventures }) {
  const [formData, setFormData] = useState(item);
  const [showNewBlocker, setShowNewBlocker] = useState(false);
  const [newBlockerTitle, setNewBlockerTitle] = useState('');
  const queryClient = useQueryClient();

  // Fetch all users for assignment
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch projects when venture changes
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', formData.venture_id],
    queryFn: async () => {
      if (!formData.venture_id) return [];
      return base44.entities.Project.filter({ venture_id: formData.venture_id }, 'name');
    },
    enabled: !!formData.venture_id,
  });

  // Fetch tasks from same project for blocking
  const { data: projectTasks = [] } = useQuery({
    queryKey: ['projectTasks', formData.project_id],
    queryFn: async () => {
      if (!formData.project_id) return [];
      const tasks = await base44.entities.Item.filter({ project_id: formData.project_id, type: 'task' });
      return tasks.filter(t => t.id !== item.id);
    },
    enabled: !!formData.project_id && formData.type === 'task',
  });

  // Fetch blocker item details
  const { data: blockerItem } = useQuery({
    queryKey: ['blockerItem', formData.blocked_by],
    queryFn: async () => {
      if (!formData.blocked_by) return null;
      const items = await base44.entities.Item.filter({ id: formData.blocked_by });
      return items[0] || null;
    },
    enabled: !!formData.blocked_by,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updated = await base44.entities.Item.update(id, data);
      
      // Create notification if task was assigned
      if (data.assigned_to && data.assigned_to !== item.assigned_to) {
        await base44.entities.Notification.create({
          user_email: data.assigned_to,
          type: 'assignment',
          item_id: id,
          message: `${currentUser?.full_name || currentUser?.email} assigned you to: ${item.title}`,
          related_user: currentUser?.email,
        });
      }
      
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onClose();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Item.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      onClose();
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ id: item.id, data: formData });
  };

  const handleSuggestionUpdate = (updates) => {
    setFormData({ ...formData, ...updates });
    updateMutation.mutate({ id: item.id, data: { ...formData, ...updates } });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(item.id);
    }
  };

  const createBlockerMutation = useMutation({
    mutationFn: async (title) => {
      const newItem = await base44.entities.Item.create({
        title,
        type: 'task',
        venture_id: formData.venture_id,
        project_id: formData.project_id,
        status: 'not_started',
      });
      return newItem;
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      setFormData({ ...formData, blocked_by: newItem.id });
      setShowNewBlocker(false);
      setNewBlockerTitle('');
    },
  });

  const handleCreateBlocker = () => {
    if (newBlockerTitle.trim()) {
      createBlockerMutation.mutate(newBlockerTitle.trim());
    }
  };

  const handleRemoveBlocker = () => {
    setFormData({ ...formData, blocked_by: null });
  };

  // Clear project_id when venture changes
  useEffect(() => {
    if (formData.venture_id !== item.venture_id) {
      setFormData((prev) => ({ ...prev, project_id: null }));
    }
  }, [formData.venture_id]);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Edit Item</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-9 sm:w-9">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* AI Suggestions */}
          {formData.type === 'task' && (
            <EnhancedTaskSuggestions item={formData} onUpdate={handleSuggestionUpdate} />
          )}
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-base"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="idea" id="idea" />
                <Label htmlFor="idea" className="cursor-pointer">Idea</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="note" id="note" />
                <Label htmlFor="note" className="cursor-pointer">Note</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="task" id="task" />
                <Label htmlFor="task" className="cursor-pointer">Task</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Venture */}
          <div className="space-y-2">
            <Label htmlFor="venture">Venture</Label>
            <Select
              value={formData.venture_id || 'none'}
              onValueChange={(value) =>
                setFormData({ ...formData, venture_id: value === 'none' ? null : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select venture" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No venture</SelectItem>
                {ventures.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          {formData.venture_id && (
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.project_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, project_id: value === 'none' ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Task-specific fields */}
          {formData.type === 'task' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || 'not_started'}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reminder */}
              <ReminderPicker
                value={formData.reminder_datetime}
                onChange={(value) => setFormData({ ...formData, reminder_datetime: value })}
              />

              {/* Assign To */}
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select
                  value={formData.assigned_to || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assigned_to: value === 'none' ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Blocked By */}
              <div className="space-y-2">
                <Label>Blocked By</Label>
                {formData.blocked_by && blockerItem ? (
                  <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <span className="flex-1 text-sm break-words">{blockerItem.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveBlocker}
                      className="h-8 w-8 flex-shrink-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ) : showNewBlocker ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter blocker task title"
                      value={newBlockerTitle}
                      onChange={(e) => setNewBlockerTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateBlocker()}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={handleCreateBlocker}
                        disabled={!newBlockerTitle.trim() || createBlockerMutation.isPending}
                        className="flex-1 sm:flex-none h-10"
                      >
                        Create Blocker
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewBlocker(false);
                          setNewBlockerTitle('');
                        }}
                        className="flex-1 sm:flex-none h-10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Select
                      value={formData.blocked_by || 'none'}
                      onValueChange={(value) => {
                        if (value === 'new') {
                          setShowNewBlocker(true);
                        } else {
                          setFormData({ ...formData, blocked_by: value === 'none' ? null : value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blocker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No blocker</SelectItem>
                        {formData.project_id && projectTasks.length > 0 && (
                          <>
                            {projectTasks.map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.title}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        <SelectItem value="new">
                          <div className="flex items-center gap-2">
                            <Plus className="w-3 h-3" />
                            Create new blocker
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP Method */}
          <div className="border-t border-stone-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">STEP Method</h3>
            
            {/* Sextant */}
            <div className="space-y-3 mb-5">
              <Label>Sextant (Urgency & Importance)</Label>
              <RadioGroup
                value={formData.s_sextant?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, s_sextant: value ? parseInt(value) : null })}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-50">
                  <RadioGroupItem value="1" id="s1" />
                  <Label htmlFor="s1" className="cursor-pointer flex-1 font-normal">
                    I - Urgent & Important
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-50">
                  <RadioGroupItem value="2" id="s2" />
                  <Label htmlFor="s2" className="cursor-pointer flex-1 font-normal">
                    II - Not Urgent but Important
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-50">
                  <RadioGroupItem value="3" id="s3" />
                  <Label htmlFor="s3" className="cursor-pointer flex-1 font-normal">
                    III - Urgent but Not Important
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-50">
                  <RadioGroupItem value="4" id="s4" />
                  <Label htmlFor="s4" className="cursor-pointer flex-1 font-normal">
                    IV - Not Urgent & Not Important
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-50">
                  <RadioGroupItem value="5" id="s5" />
                  <Label htmlFor="s5" className="cursor-pointer flex-1 font-normal">
                    V - Late but Important
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-stone-50">
                  <RadioGroupItem value="6" id="s6" />
                  <Label htmlFor="s6" className="cursor-pointer flex-1 font-normal">
                    VI - Late & Not Important
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Time, Effort, Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Time */}
              <div className="space-y-2">
                <Label>Time</Label>
                <RadioGroup
                  value={formData.t_time?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, t_time: value ? parseInt(value) : null })}
                  className="flex sm:flex-col gap-2"
                >
                  <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                    <RadioGroupItem value="1" id="t1" />
                    <Label htmlFor="t1" className="cursor-pointer text-sm">Short</Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                    <RadioGroupItem value="2" id="t2" />
                    <Label htmlFor="t2" className="cursor-pointer text-sm">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                    <RadioGroupItem value="3" id="t3" />
                    <Label htmlFor="t3" className="cursor-pointer text-sm">Long</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Effort */}
              <div className="space-y-2">
                <Label>Effort</Label>
                <RadioGroup
                  value={formData.e_effort?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, e_effort: value ? parseInt(value) : null })}
                  className="flex sm:flex-col gap-2"
                >
                  <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                    <RadioGroupItem value="1" id="e1" />
                    <Label htmlFor="e1" className="cursor-pointer text-sm">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                    <RadioGroupItem value="2" id="e2" />
                    <Label htmlFor="e2" className="cursor-pointer text-sm">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                    <RadioGroupItem value="3" id="e3" />
                    <Label htmlFor="e3" className="cursor-pointer text-sm">High</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <RadioGroup
                  value={formData.p_priority?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, p_priority: value ? parseInt(value) : null })}
                  className="flex sm:flex-col gap-2"
                >
                  <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                    <RadioGroupItem value="1" id="p1" />
                    <Label htmlFor="p1" className="cursor-pointer text-sm">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                    <RadioGroupItem value="2" id="p2" />
                    <Label htmlFor="p2" className="cursor-pointer text-sm">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                    <RadioGroupItem value="3" id="p3" />
                    <Label htmlFor="p3" className="cursor-pointer text-sm">High</Label>
                  </div>
                </RadioGroup>
              </div>
              </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-stone-200 pt-6">
              <CommentSection itemId={item.id} />
              </div>

              {/* Documents Section */}
              <div className="border-t border-stone-200 pt-6">
              <DocumentList entityType="item" entityId={item.id} />
              </div>
              </div>

              {/* Footer */}
        <div className="border-t border-stone-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-11 sm:h-9"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-[#14B8A6] hover:bg-[#0d9488] text-white h-11 sm:h-9"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
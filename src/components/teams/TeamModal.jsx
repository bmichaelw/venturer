import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TeamModal({ team, onClose }) {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
  });
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [selectedVentures, setSelectedVentures] = useState([]);
  const [isInviteMode, setIsInviteMode] = useState(false);

  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.filter({ active: true }, 'name'),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const newTeam = await base44.entities.Team.create(data);
      
      // Add creator as lead
      await base44.entities.TeamMember.create({
        team_id: newTeam.id,
        user_email: currentUser.email,
        role: 'lead',
      });

      // Separate existing users from invites
      const existingMembers = members.filter(m => !m.isInvite);
      const invitedMembers = members.filter(m => m.isInvite);

      // Add existing members
      if (existingMembers.length > 0) {
        await base44.entities.TeamMember.bulkCreate(
          existingMembers.map(m => ({
            team_id: newTeam.id,
            user_email: m.email,
            role: m.role,
          }))
        );
      }

      // Invite new members
      if (invitedMembers.length > 0) {
        await Promise.all(
          invitedMembers.map(m =>
            base44.users.inviteUser(m.email, m.role === 'lead' ? 'admin' : 'user')
          )
        );
        // Note: They'll need to be added to TeamMember after they accept the invitation
      }

      // Associate selected ventures with this team
      if (selectedVentures.length > 0) {
        await Promise.all(
          selectedVentures.map(ventureId =>
            base44.entities.Venture.update(ventureId, { team_id: newTeam.id })
          )
        );
      }

      return newTeam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      queryClient.invalidateQueries({ queryKey: ['ventures'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.update(team.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (team) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const addMember = () => {
    if (!newMemberEmail) return;
    
    if (isInviteMode) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newMemberEmail)) return;
      
      setMembers([...members, { 
        email: newMemberEmail, 
        role: newMemberRole, 
        name: newMemberEmail,
        isInvite: true 
      }]);
    } else {
      const user = users.find(u => u.email === newMemberEmail);
      if (!user) return;
      
      setMembers([...members, { 
        email: newMemberEmail, 
        role: newMemberRole, 
        name: user.full_name,
        isInvite: false 
      }]);
    }
    
    setNewMemberEmail('');
    setNewMemberRole('member');
    setIsInviteMode(false);
  };

  const removeMember = (email) => {
    setMembers(members.filter(m => m.email !== email));
  };

  const toggleVenture = (ventureId) => {
    setSelectedVentures(prev =>
      prev.includes(ventureId)
        ? prev.filter(id => id !== ventureId)
        : [...prev, ventureId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {team ? 'Edit Team' : 'Create Team'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {!team && ventures.length > 0 && (
            <div className="space-y-3 border-t border-stone-200 pt-6">
              <Label>Ventures</Label>
              <p className="text-xs text-slate-500">Select which venture(s) this team will work on</p>
              
              <div className="space-y-2 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-3">
                {ventures.map((venture) => (
                  <div key={venture.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`venture-${venture.id}`}
                      checked={selectedVentures.includes(venture.id)}
                      onCheckedChange={() => toggleVenture(venture.id)}
                    />
                    <label
                      htmlFor={`venture-${venture.id}`}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: venture.color }}
                      />
                      <span className="text-sm text-slate-900">{venture.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!team && (
            <div className="space-y-3 border-t border-stone-200 pt-6">
              <div className="flex items-center justify-between">
                <Label>Team Members</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsInviteMode(!isInviteMode)}
                  className="text-xs"
                >
                  {isInviteMode ? 'Select Existing' : 'Invite New'}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                {isInviteMode 
                  ? 'Enter email to invite someone new' 
                  : 'Select from existing users or invite new members'}
              </p>
              
              <div className="flex gap-2">
                {isInviteMode ? (
                  <Input
                    placeholder="email@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    type="email"
                    className="flex-1"
                  />
                ) : (
                  <Select value={newMemberEmail} onValueChange={setNewMemberEmail}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.email !== currentUser?.email && !members.some(m => m.email === u.email)).map((user) => (
                        <SelectItem key={user.email} value={user.email}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="button" onClick={addMember} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {members.length > 0 && (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.email} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {member.name || member.email}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                        {member.isInvite && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Will be invited
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(member.email)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-slate-500 italic">
                You can add more members later from the team dashboard
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {team ? 'Update' : 'Create'} Team
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
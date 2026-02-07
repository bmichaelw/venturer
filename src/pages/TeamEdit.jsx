import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

export default function TeamEditPage() {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({ name: '', description: '' });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [isInviteMode, setIsInviteMode] = useState(false);

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const teams = await base44.entities.Team.filter({ id: teamId });
      const team = teams[0];
      setFormData({ name: team.name, description: team.description || '' });
      return team;
    },
    enabled: !!teamId,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: () => base44.entities.TeamMember.filter({ team_id: teamId }),
    enabled: !!teamId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.update(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ email, role, isInvite }) => {
      if (isInvite) {
        await base44.users.inviteUser(email, role === 'lead' ? 'admin' : 'user');
      }
      await base44.entities.TeamMember.create({
        team_id: teamId,
        user_email: email,
        role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
      setNewMemberEmail('');
      setNewMemberRole('member');
      setIsInviteMode(false);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => base44.entities.TeamMember.delete(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
    },
  });

  const handleSave = () => {
    updateTeamMutation.mutate(formData);
  };

  const handleAddMember = () => {
    if (!newMemberEmail) return;

    if (isInviteMode) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newMemberEmail)) return;
    } else {
      const user = users.find(u => u.email === newMemberEmail);
      if (!user) return;
    }

    addMemberMutation.mutate({
      email: newMemberEmail,
      role: newMemberRole,
      isInvite: isInviteMode,
    });
  };

  if (!team) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/Teams" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Teams
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200/50 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Edit Team</h1>
          <Button onClick={handleSave} disabled={updateTeamMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Team Details */}
        <div className="space-y-6 mb-8">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
        </div>

        {/* Team Members */}
        <div className="border-t border-stone-200 pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Team Members</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsInviteMode(!isInviteMode)}
              className="text-xs"
            >
              {isInviteMode ? 'Select Existing' : 'Invite New'}
            </Button>
          </div>

          <div className="flex gap-2 mb-6">
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
                  {users.filter(u => !teamMembers.some(m => m.user_email === u.email)).map((user) => (
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

            <Button 
              onClick={handleAddMember} 
              size="icon"
              disabled={addMemberMutation.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {teamMembers.map((member) => {
              const user = users.find(u => u.email === member.user_email);
              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {user?.full_name || member.user_email}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{member.user_email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMemberMutation.mutate(member.id)}
                    disabled={removeMemberMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
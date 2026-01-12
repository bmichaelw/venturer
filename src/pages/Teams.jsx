import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import TeamCard from '../components/teams/TeamCard';
import TeamModal from '../components/teams/TeamModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function TeamsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.filter({ active: true }, 'name'),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const handleEdit = (team) => {
    setEditingTeam(team);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingTeam(null);
  };

  // Get user's role in each team
  const getTeamRole = (teamId) => {
    const membership = teamMembers.find(
      m => m.team_id === teamId && m.user_email === currentUser?.email
    );
    return membership?.role;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Teams</h1>
          <p className="text-slate-600">Collaborate with your team on ventures and projects</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Team
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/50 p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No teams yet</h3>
          <p className="text-slate-600 mb-6">Create your first team to start collaborating</p>
          <Button onClick={() => setModalOpen(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              userRole={getTeamRole(team.id)}
              onEdit={handleEdit}
              teamMembers={teamMembers.filter(m => m.team_id === team.id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <TeamModal
          team={editingTeam}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
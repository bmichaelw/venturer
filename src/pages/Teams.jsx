import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Users, Plus, FileText } from 'lucide-react';
import TeamCard from '../components/teams/TeamCard';
import TeamModal from '../components/teams/TeamModal';
import ProjectTemplateModal from '../components/teams/ProjectTemplateModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function TeamsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xs text-[#805c5c] uppercase tracking-widest mb-2" style={{fontFamily: 'Acherus Grotesque, sans-serif'}}>TEAMS</h1>
          <p className="text-xl sm:text-2xl text-[#323232]" style={{fontFamily: 'Acherus Grotesque, sans-serif', fontWeight: 700}}>Clarity across every venture you touch.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-[#223947] hover:bg-[#223947]/90 text-[#fffbf6] w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Team
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[#805c5c]" style={{fontFamily: 'Montserrat, sans-serif'}}>Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#dbb4b4] p-12 text-center">
          <Users className="w-16 h-16 text-[#dbb4b4] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#323232] mb-2" style={{fontFamily: 'Acherus Grotesque, sans-serif'}}>No teams yet</h3>
          <p className="text-[#805c5c] mb-6" style={{fontFamily: 'Montserrat, sans-serif'}}>Create your first team to start collaborating</p>
          <Button onClick={() => setModalOpen(true)} className="bg-[#223947] hover:bg-[#223947]/90 text-[#fffbf6]">
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
              onTemplates={(teamId) => {
                setSelectedTeamId(teamId);
                setTemplateModalOpen(true);
              }}
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

      {templateModalOpen && (
        <ProjectTemplateModal
          teamId={selectedTeamId}
          onClose={() => {
            setTemplateModalOpen(false);
            setSelectedTeamId(null);
          }}
        />
      )}
    </div>
  );
}
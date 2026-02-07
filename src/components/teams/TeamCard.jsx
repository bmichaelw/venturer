import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Settings, BarChart3, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function TeamCard({ team, userRole, onEdit, onTemplates, teamMembers }) {
  const canManage = userRole === 'lead';

  return (
    <div className="bg-white rounded-xl border border-stone-200/50 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{team.name}</h3>
            {userRole && (
              <Badge variant="outline" className="text-xs mt-1">
                {userRole}
              </Badge>
            )}
          </div>
        </div>
        {canManage && (
          <Button variant="ghost" size="icon" onClick={() => onEdit(team)}>
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {team.description && (
        <p className="text-sm text-slate-600 mb-4">{team.description}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="w-4 h-4" />
          <span>{teamMembers.length} members</span>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <>
              <Link to={createPageUrl('TeamEdit') + '?id=' + team.id}>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Link to={createPageUrl('TeamDashboard') + '?team=' + team.id}>
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
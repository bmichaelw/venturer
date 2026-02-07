import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Users, TrendingUp, AlertCircle, CheckCircle2, Settings, Calendar, Filter, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CapacityPlanner from '../components/teams/CapacityPlanner';
import { format, parseISO } from 'date-fns';

export default function TeamDashboardPage() {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('team');
  const [filterVenture, setFilterVenture] = useState('all');
  const [filterProject, setFilterProject] = useState('all');

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const teams = await base44.entities.Team.filter({ id: teamId });
      return teams[0];
    },
    enabled: !!teamId,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: () => base44.entities.TeamMember.filter({ team_id: teamId }),
    enabled: !!teamId,
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures', teamId],
    queryFn: () => base44.entities.Venture.filter({ team_id: teamId }),
    enabled: !!teamId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', teamId],
    queryFn: async () => {
      if (ventures.length === 0) return [];
      const ventureIds = ventures.map(v => v.id);
      const allProjects = await base44.entities.Project.list();
      return allProjects.filter(p => ventureIds.includes(p.venture_id));
    },
    enabled: ventures.length > 0,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const ventureIds = ventures.map(v => v.id);
  let teamItems = items.filter(item => ventureIds.includes(item.venture_id));

  // Apply filters
  if (filterVenture !== 'all') {
    teamItems = teamItems.filter(item => item.venture_id === filterVenture);
  }
  if (filterProject !== 'all') {
    teamItems = teamItems.filter(item => item.project_id === filterProject);
  }

  const memberStats = useMemo(() => {
    const stats = {};
    
    teamMembers.forEach(member => {
      const memberItems = teamItems.filter(
        item => item.assigned_to === member.user_email || item.created_by === member.user_email
      );
      const tasks = memberItems.filter(item => item.type === 'task');
      const completed = tasks.filter(t => t.status === 'completed').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const overdue = tasks.filter(t => 
        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
      ).length;

      const user = users.find(u => u.email === member.user_email);
      
      stats[member.user_email] = {
        user,
        role: member.role,
        totalTasks: tasks.length,
        completed,
        inProgress,
        overdue,
        completionRate: tasks.length > 0 ? ((completed / tasks.length) * 100).toFixed(0) : 0,
      };
    });

    return stats;
  }, [teamMembers, teamItems, users]);

  const teamMetrics = useMemo(() => {
    const tasks = teamItems.filter(item => item.type === 'task');
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length;

    return {
      totalTasks: tasks.length,
      completed,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      overdue,
      completionRate: tasks.length > 0 ? ((completed / tasks.length) * 100).toFixed(0) : 0,
    };
  }, [teamItems]);

  if (!team) {
    return <div className="text-center py-12">Loading team dashboard...</div>;
  }

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  // Upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    const tasks = teamItems.filter(item => item.type === 'task' && item.due_date && item.status !== 'completed');
    return tasks
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);
  }, [teamItems]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-[#323232] mb-2 tracking-tight" style={{fontFamily: 'Acherus Grotesque'}}>{team.name} Dashboard</h1>
          <p className="text-sm sm:text-base text-[#805c5c]" style={{fontFamily: 'Montserrat'}}>Team performance and workload overview</p>
        </div>
        <Link to={`/TeamEdit?id=${teamId}`} className="w-full sm:w-auto">
          <Button variant="outline" className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Edit Team
          </Button>
        </Link>
      </div>

      {/* Team Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-stone-200/50 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{teamMembers.length}</h3>
          <p className="text-sm text-slate-600">Team Members</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/50 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{teamMetrics.completed}</h3>
          <p className="text-sm text-slate-600">Completed Tasks</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/50 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{teamMetrics.completionRate}%</h3>
          <p className="text-sm text-slate-600">Completion Rate</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/50 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{teamMetrics.overdue}</h3>
          <p className="text-sm text-slate-600">Overdue Tasks</p>
        </div>
      </div>

      {/* Filters & Upcoming Deadlines Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Task Filters */}
        <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Team Tasks
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Venture</label>
              <Select value={filterVenture} onValueChange={setFilterVenture}>
                <SelectTrigger>
                  <SelectValue placeholder="All Ventures" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ventures</SelectItem>
                  {ventures.map((venture) => (
                    <SelectItem key={venture.id} value={venture.id}>
                      {venture.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Project</label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterVenture !== 'all' || filterProject !== 'all') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setFilterVenture('all');
                  setFilterProject('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Deadlines
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming deadlines</p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date();
                const venture = ventures.find(v => v.id === task.venture_id);
                return (
                  <Link key={task.id} to={`/ItemDetail?id=${task.id}`}>
                    <div className="p-3 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 mb-1">{task.title}</p>
                          {venture && (
                            <div className="flex items-center gap-1 mb-1">
                              <div 
                                className="w-2 h-2 rounded"
                                style={{ backgroundColor: venture.color }}
                              />
                              <span className="text-xs text-slate-600">{venture.name}</span>
                            </div>
                          )}
                        </div>
                        <div className={`text-xs font-medium whitespace-nowrap ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                          {format(parseISO(task.due_date), 'MMM d')}
                          {isOverdue && <span className="ml-1">⚠️</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Capacity Planning */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Team Capacity Planning</h2>
        <CapacityPlanner 
          teamMembers={teamMembers}
          teamItems={teamItems}
          users={users}
        />
      </div>

      {/* Member Workload */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Team Member Details</h2>
        <div className="space-y-4">
          {Object.entries(memberStats).map(([email, stats]) => (
            <div key={email} className="border border-stone-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-slate-200 text-slate-700">
                      {getInitials(stats.user?.full_name, email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {stats.user?.full_name || email}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {stats.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{stats.completionRate}%</div>
                  <div className="text-xs text-slate-500">completion</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                <div>
                  <div className="text-xs sm:text-sm text-slate-600">Total</div>
                  <div className="text-base sm:text-lg font-semibold text-slate-900">{stats.totalTasks}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-slate-600">Completed</div>
                  <div className="text-base sm:text-lg font-semibold text-emerald-600">{stats.completed}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-slate-600">In Progress</div>
                  <div className="text-base sm:text-lg font-semibold text-amber-600">{stats.inProgress}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-slate-600">Overdue</div>
                  <div className="text-base sm:text-lg font-semibold text-red-600">{stats.overdue}</div>
                </div>
              </div>

              <Progress value={parseInt(stats.completionRate)} className="h-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
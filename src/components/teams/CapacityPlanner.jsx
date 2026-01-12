import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function CapacityPlanner({ teamMembers, teamItems, users }) {
  const capacityData = useMemo(() => {
    const ESTIMATED_CAPACITY = 40; // hours per week equivalent

    return teamMembers.map((member) => {
      const memberTasks = teamItems.filter(
        item => item.assigned_to === member.user_email && item.type === 'task' && item.status !== 'completed'
      );

      const estimatedHours = memberTasks.reduce((sum, task) => {
        // Estimate hours based on effort and time
        const effortMultiplier = (task.e_effort || 1) * 5; // 1=5hrs, 2=10hrs, 3=15hrs
        const timeMultiplier = (task.t_time || 1) * 3; // 1=3 days, 2=6 days, 3=9 days
        return sum + (effortMultiplier + timeMultiplier);
      }, 0);

      const utilization = Math.min(100, (estimatedHours / (ESTIMATED_CAPACITY * 7 * 24)) * 100);
      const user = users.find(u => u.email === member.user_email);

      return {
        name: user?.full_name?.split(' ')[0] || member.user_email,
        email: member.user_email,
        estimated: estimatedHours,
        capacity: ESTIMATED_CAPACITY * 7 * 24,
        utilization: parseFloat(utilization.toFixed(1)),
        tasks: memberTasks.length,
        status: utilization > 90 ? 'overloaded' : utilization > 70 ? 'busy' : 'available',
      };
    });
  }, [teamMembers, teamItems, users]);

  const overloaded = capacityData.filter(m => m.status === 'overloaded');
  const busy = capacityData.filter(m => m.status === 'busy');
  const available = capacityData.filter(m => m.status === 'available');

  const getStatusColor = (status) => {
    switch (status) {
      case 'overloaded':
        return '#ef4444';
      case 'busy':
        return '#f59e0b';
      case 'available':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'overloaded':
        return <Badge className="bg-red-100 text-red-800">Overloaded</Badge>;
      case 'busy':
        return <Badge className="bg-amber-100 text-amber-800">Busy</Badge>;
      case 'available':
        return <Badge className="bg-emerald-100 text-emerald-800">Available</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {overloaded.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-900">Overloaded</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{overloaded.length}</div>
            <p className="text-xs text-red-700">members at capacity</p>
          </div>
        )}
        {busy.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-900">Busy</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{busy.length}</div>
            <p className="text-xs text-amber-700">members moderately loaded</p>
          </div>
        )}
        {available.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-emerald-900">Available</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{available.length}</div>
            <p className="text-xs text-emerald-700">members with capacity</p>
          </div>
        )}
      </div>

      {/* Capacity Chart */}
      <div className="bg-white rounded-lg border border-stone-200 p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-4">Workload Distribution</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={capacityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="estimated" fill="#3b82f6" name="Estimated Load" />
            <Bar dataKey="capacity" fill="#e5e7eb" name="Total Capacity" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Member Details */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-900">Team Member Capacity</h4>
        <div className="space-y-3">
          {capacityData.map((member) => (
            <div key={member.email} className="bg-white border border-stone-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-medium text-slate-900">{member.name}</h5>
                  <p className="text-xs text-slate-500">{member.tasks} active tasks</p>
                </div>
                {getStatusBadge(member.status)}
              </div>

              <div className="space-y-1 mb-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Capacity: {member.utilization}%</span>
                  <span>{member.estimated.toFixed(0)}h / {member.capacity.toFixed(0)}h</span>
                </div>
                <Progress value={member.utilization} className="h-2" />
              </div>

              {member.status === 'overloaded' && (
                <p className="text-xs text-red-600 mt-2">⚠️ Consider reassigning tasks from this member</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
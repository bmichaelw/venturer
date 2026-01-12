import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProjectProgressChart({ items, projects, ventures }) {
  const chartData = useMemo(() => {
    const projectStats = {};

    projects.forEach(project => {
      const projectItems = items.filter(item => item.project_id === project.id && item.type === 'task');
      const completed = projectItems.filter(t => t.status === 'completed').length;
      const inProgress = projectItems.filter(t => t.status === 'in_progress').length;
      const notStarted = projectItems.filter(t => t.status === 'not_started').length;

      if (projectItems.length > 0) {
        projectStats[project.id] = {
          name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
          completed,
          inProgress,
          notStarted,
        };
      }
    });

    return Object.values(projectStats).slice(0, 8); // Top 8 projects
  }, [items, projects]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200/50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Progress</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          No project data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200/50 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Progress</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }} 
          />
          <Legend />
          <Bar dataKey="completed" fill="#10b981" name="Completed" />
          <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
          <Bar dataKey="notStarted" fill="#64748b" name="Not Started" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
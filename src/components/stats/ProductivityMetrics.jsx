import React, { useMemo } from 'react';
import { CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';

export default function ProductivityMetrics({ items, users }) {
  const metrics = useMemo(() => {
    const tasks = items.filter(item => item.type === 'task');
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completionRate = tasks.length > 0 ? ((completed / tasks.length) * 100).toFixed(1) : 0;

    // Calculate average completion time (for tasks with dates)
    const completedWithDates = tasks.filter(t => 
      t.status === 'completed' && t.due_date && t.updated_date
    );
    
    // User productivity
    const userTasks = {};
    tasks.forEach(task => {
      const assignee = task.assigned_to || task.created_by;
      if (!userTasks[assignee]) {
        userTasks[assignee] = { total: 0, completed: 0 };
      }
      userTasks[assignee].total++;
      if (task.status === 'completed') {
        userTasks[assignee].completed++;
      }
    });

    const activeUsers = Object.keys(userTasks).length;

    return {
      totalTasks: tasks.length,
      completed,
      inProgress,
      completionRate,
      activeUsers,
    };
  }, [items, users]);

  const cards = [
    {
      title: 'Total Tasks',
      value: metrics.totalTasks,
      icon: Clock,
      color: 'bg-blue-500',
    },
    {
      title: 'Completed',
      value: metrics.completed,
      icon: CheckCircle2,
      color: 'bg-emerald-500',
    },
    {
      title: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      icon: TrendingUp,
      color: 'bg-amber-500',
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      icon: Users,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-stone-200/50 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{card.value}</h3>
            <p className="text-sm text-slate-600">{card.title}</p>
          </div>
        );
      })}
    </div>
  );
}
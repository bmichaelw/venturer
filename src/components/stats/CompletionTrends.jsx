import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, eachDayOfInterval, eachWeekOfInterval, startOfWeek } from 'date-fns';

export default function CompletionTrends({ items, dateRange }) {
  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];

    const tasks = items.filter(item => item.type === 'task' && item.status === 'completed');
    
    // Determine if we should show daily or weekly based on range
    const daysDiff = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24));
    const useWeekly = daysDiff > 60;

    const intervals = useWeekly
      ? eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }).map(d => startOfWeek(d))
      : eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

    const completionsByDate = {};
    tasks.forEach(task => {
      if (task.updated_date) {
        const date = parseISO(task.updated_date);
        const key = useWeekly 
          ? format(startOfWeek(date), 'MMM d')
          : format(date, 'MMM d');
        completionsByDate[key] = (completionsByDate[key] || 0) + 1;
      }
    });

    return intervals.map(date => ({
      date: format(date, 'MMM d'),
      completed: completionsByDate[format(date, 'MMM d')] || 0,
    }));
  }, [items, dateRange]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200/50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Completion Trends</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          No completion data for selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200/50 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Completion Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="completed" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            name="Tasks Completed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
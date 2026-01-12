import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function StepAnalysisChart({ items }) {
  const stepData = useMemo(() => {
    const sextantData = [
      { name: 'S:I (Urgent+Important)', value: 0, color: '#ef4444' },
      { name: 'S:II (Not Urgent+Important)', value: 0, color: '#3b82f6' },
      { name: 'S:III (Urgent+Not Important)', value: 0, color: '#64748b' },
      { name: 'S:IV (Not Urgent+Not Important)', value: 0, color: '#94a3b8' },
      { name: 'S:V (Late+Important)', value: 0, color: '#dc2626' },
      { name: 'S:VI (Late+Not Important)', value: 0, color: '#9ca3af' },
    ];

    const timeData = [
      { name: 'Short', value: 0 },
      { name: 'Medium', value: 0 },
      { name: 'Long', value: 0 },
    ];

    const effortData = [
      { name: 'Low', value: 0 },
      { name: 'Medium', value: 0 },
      { name: 'High', value: 0 },
    ];

    const priorityData = [
      { name: 'Low', value: 0, color: '#10b981' },
      { name: 'Medium', value: 0, color: '#f59e0b' },
      { name: 'High', value: 0, color: '#ef4444' },
    ];

    items.forEach(item => {
      if (item.s_sextant) {
        sextantData[item.s_sextant - 1].value++;
      }
      if (item.t_time) {
        timeData[item.t_time - 1].value++;
      }
      if (item.e_effort) {
        effortData[item.e_effort - 1].value++;
      }
      if (item.p_priority) {
        priorityData[item.p_priority - 1].value++;
      }
    });

    return { sextantData, timeData, effortData, priorityData };
  }, [items]);

  const hasData = items.some(item => item.s_sextant || item.t_time || item.e_effort || item.p_priority);

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-stone-200/50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">STEP Analysis</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          No STEP data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200/50 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">STEP Analysis</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sextant Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Sextant Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stepData.sextantData.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {stepData.sextantData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Priority Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stepData.priorityData.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {stepData.priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Time & Effort */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Time Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stepData.timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#9333ea" name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Effort Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stepData.effortData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#f97316" name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { format, differenceInDays, addDays, startOfMonth } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ProjectGanttChart({ tasks, startDate }) {
  if (!tasks || tasks.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-500">
        No tasks with due dates to display in timeline
      </Card>
    );
  }

  const tasksWithDates = tasks.filter(t => t.due_date);
  if (tasksWithDates.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-500">
        No tasks with due dates to display in timeline
      </Card>
    );
  }

  // Calculate date range
  const projectStart = startDate ? new Date(startDate) : new Date();
  const allDates = tasksWithDates.map(t => new Date(t.due_date));
  const minDate = new Date(Math.min(projectStart, ...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalDays = differenceInDays(maxDate, minDate) + 1;

  // Generate month headers
  const months = [];
  let current = new Date(minDate);
  while (current <= maxDate) {
    months.push({
      label: format(current, 'MMM yyyy'),
      days: new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate(),
    });
    current = addDays(startOfMonth(current), 32);
    current = startOfMonth(current);
  }

  const getTaskPosition = (dueDate) => {
    const taskDate = new Date(dueDate);
    const daysFromStart = differenceInDays(taskDate, minDate);
    return (daysFromStart / totalDays) * 100;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'canceled':
        return 'bg-red-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <Card className="p-4 overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Timeline Header */}
        <div className="flex border-b pb-2 mb-4">
          {months.map((month, idx) => (
            <div
              key={idx}
              className="text-xs font-semibold text-slate-600 text-center"
              style={{ width: `${(month.days / totalDays) * 100}%` }}
            >
              {month.label}
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          {tasksWithDates.map((task) => {
            const position = getTaskPosition(task.due_date);
            return (
              <div key={task.id} className="relative h-10 flex items-center">
                {/* Task Name */}
                <div className="w-48 pr-4 text-sm truncate flex-shrink-0">
                  {task.title}
                </div>

                {/* Timeline Bar */}
                <div className="flex-1 relative h-8 bg-slate-100 rounded">
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-6 ${getStatusColor(
                      task.status
                    )} rounded flex items-center justify-center transition-all hover:opacity-80 cursor-pointer group`}
                    style={{
                      left: `${Math.max(0, position - 2)}%`,
                      width: '4%',
                      minWidth: '60px',
                    }}
                  >
                    <span className="text-white text-xs font-medium">
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      <div className="font-medium">{task.title}</div>
                      <div>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</div>
                      {task.assigned_to && <div>Assigned: {task.assigned_to}</div>}
                    </div>
                  </div>

                  {/* Today marker */}
                  {differenceInDays(new Date(), minDate) >= 0 &&
                    differenceInDays(new Date(), minDate) <= totalDays && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                        style={{
                          left: `${(differenceInDays(new Date(), minDate) / totalDays) * 100}%`,
                        }}
                      />
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-6 pt-4 border-t text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-400 rounded"></div>
            <span>Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-red-500"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
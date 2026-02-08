import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, addMonths, addDays, format, isSameDay, parseISO } from 'date-fns';
import CalendarFilters from '../components/calendar/CalendarFilters';
import CalendarTaskCard from '../components/calendar/CalendarTaskCard';
import ItemDetailPanel from '../components/dump/ItemDetailPanel';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); // day, week, month
  const [filters, setFilters] = useState({
    venture_id: null,
    project_id: null,
    s_sextant: [],
    t_time: [],
    e_effort: [],
    p_priority: [],
  });
  const [selectedItem, setSelectedItem] = useState(null);

  const queryClient = useQueryClient();

  // Fetch all items
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
  });

  // Fetch ventures
  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.filter({ active: true }, 'name'),
  });

  // Filter tasks with due dates
  const filteredTasks = useMemo(() => {
    let tasks = allItems.filter(item => item.type === 'task' && item.due_date);

    if (filters.venture_id) {
      tasks = tasks.filter(item => item.venture_id === filters.venture_id);
    }
    if (filters.project_id) {
      tasks = tasks.filter(item => item.project_id === filters.project_id);
    }
    if (filters.s_sextant?.length > 0) {
      tasks = tasks.filter(item => filters.s_sextant.includes(item.s_sextant));
    }
    if (filters.t_time?.length > 0) {
      tasks = tasks.filter(item => filters.t_time.includes(item.t_time));
    }
    if (filters.e_effort?.length > 0) {
      tasks = tasks.filter(item => filters.e_effort.includes(item.e_effort));
    }
    if (filters.p_priority?.length > 0) {
      tasks = tasks.filter(item => filters.p_priority.includes(item.p_priority));
    }

    return tasks;
  }, [allItems, filters]);

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (view === 'day') {
      return [currentDate];
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const days = [];
      for (let i = 0; i < 7; i++) {
        days.push(addDays(start, i));
      }
      return days;
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const days = [];
      let day = start;
      while (day <= end) {
        days.push(day);
        day = addDays(day, 1);
      }
      return days;
    }
  }, [currentDate, view]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = {};
    filteredTasks.forEach(task => {
      const dateKey = format(parseISO(task.due_date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  const navigate = (direction) => {
    if (view === 'day') {
      setCurrentDate(addDays(currentDate, direction));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, direction));
    } else {
      setCurrentDate(addMonths(currentDate, direction));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderText = () => {
    if (view === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#323232] mb-2 tracking-tight" style={{fontFamily: 'Acherus Grotesque'}}>Calendar</h1>
        <p className="text-sm sm:text-base text-[#805c5c]" style={{fontFamily: 'Montserrat'}}>View and manage tasks across all ventures</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="px-2 sm:px-4">
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
              className={`${view === 'day' ? 'bg-slate-900' : ''} px-2 sm:px-3`}
            >
              <span className="hidden xs:inline sm:hidden">Day</span>
              <span className="xs:hidden sm:inline">Day</span>
              <span className="xs:hidden">D</span>
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
              className={`${view === 'week' ? 'bg-slate-900' : ''} px-2 sm:px-3`}
            >
              <span className="hidden xs:inline sm:hidden">Week</span>
              <span className="xs:hidden sm:inline">Week</span>
              <span className="xs:hidden">W</span>
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
              className={`${view === 'month' ? 'bg-slate-900' : ''} px-2 sm:px-3`}
            >
              <span className="hidden xs:inline sm:hidden">Month</span>
              <span className="xs:hidden sm:inline">Month</span>
              <span className="xs:hidden">M</span>
            </Button>
          </div>
        </div>
        
        <span className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900">{getHeaderText()}</span>
      </div>

      {/* Filters */}
      <CalendarFilters
        filters={filters}
        setFilters={setFilters}
        ventures={ventures}
      />

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden">
        {view === 'month' ? (
          <div className="grid grid-cols-7 gap-px bg-stone-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-stone-50 px-1 sm:px-3 py-2 text-[10px] sm:text-xs font-semibold text-slate-600 text-center">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day[0]}</span>
              </div>
            ))}
            {dateRange.map(date => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const tasks = tasksByDate[dateKey] || [];
              const isToday = isSameDay(date, new Date());

              return (
                <div
                  key={dateKey}
                  className={`bg-white min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 ${isToday ? 'bg-amber-50' : ''}`}
                >
                  <div className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isToday ? 'text-amber-600' : 'text-slate-700'}`}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1">
                    {tasks.slice(0, 2).map(task => (
                      <CalendarTaskCard
                        key={task.id}
                        task={task}
                        ventures={ventures}
                        compact
                        onClick={() => setSelectedItem(task)}
                      />
                    ))}
                    {tasks.length > 2 && (
                      <div className="text-[10px] sm:text-xs text-slate-500">+{tasks.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`grid ${view === 'week' ? 'grid-cols-2 sm:grid-cols-7' : 'grid-cols-1'} gap-px bg-stone-200`}>
            {dateRange.map(date => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const tasks = tasksByDate[dateKey] || [];
              const isToday = isSameDay(date, new Date());

              return (
                <div key={dateKey} className={`bg-white p-2 sm:p-4 ${isToday ? 'bg-amber-50' : ''}`}>
                  <div className={`text-xs sm:text-sm font-semibold mb-2 sm:mb-3 ${isToday ? 'text-amber-600' : 'text-slate-700'}`}>
                    {format(date, view === 'week' ? 'EEE d' : 'EEEE, MMMM d')}
                  </div>
                  <div className="space-y-2">
                    {tasks.length === 0 ? (
                      <p className="text-xs sm:text-sm text-slate-400 italic">No tasks</p>
                    ) : (
                      tasks.map(task => (
                        <CalendarTaskCard
                          key={task.id}
                          task={task}
                          ventures={ventures}
                          onClick={() => setSelectedItem(task)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Detail Panel */}
      {selectedItem && (
        <ItemDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          ventures={ventures}
        />
      )}
    </div>
  );
}
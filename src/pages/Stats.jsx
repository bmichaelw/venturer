import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfYear, subDays, subMonths, parseISO, isWithinInterval } from 'date-fns';
import ProjectProgressChart from '../components/stats/ProjectProgressChart';
import StepAnalysisChart from '../components/stats/StepAnalysisChart';
import ProductivityMetrics from '../components/stats/ProductivityMetrics';
import CompletionTrends from '../components/stats/CompletionTrends';

export default function StatsPage() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [selectedVenture, setSelectedVenture] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (selectedVenture !== 'all') {
      filtered = filtered.filter(item => item.venture_id === selectedVenture);
    }

    if (selectedProject !== 'all') {
      filtered = filtered.filter(item => item.project_id === selectedProject);
    }

    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = parseISO(item.created_date);
        return isWithinInterval(itemDate, { start: dateRange.from, end: dateRange.to });
      });
    }

    return filtered;
  }, [items, selectedVenture, selectedProject, dateRange]);

  const setQuickRange = (range) => {
    const now = new Date();
    switch (range) {
      case 'week':
        setDateRange({ from: startOfWeek(now), to: now });
        break;
      case 'month':
        setDateRange({ from: startOfMonth(now), to: now });
        break;
      case '3months':
        setDateRange({ from: subMonths(now, 3), to: now });
        break;
      case 'year':
        setDateRange({ from: startOfYear(now), to: now });
        break;
      case 'all':
        setDateRange({ from: null, to: null });
        break;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#323232] mb-2 tracking-tight" style={{fontFamily: 'Acherus Grotesque'}}>Analytics & Reports</h1>
        <p className="text-sm sm:text-base text-[#805c5c]" style={{fontFamily: 'Montserrat'}}>Track progress, analyze patterns, and measure productivity</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200/50 p-4 sm:p-5 mb-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-slate-700">Filters:</span>

          {/* Quick Date Ranges */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuickRange('week')} className="text-xs sm:text-sm px-2 sm:px-3">Week</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('month')} className="text-xs sm:text-sm px-2 sm:px-3">Month</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('3months')} className="text-xs sm:text-sm px-2 sm:px-3">3M</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('year')} className="text-xs sm:text-sm px-2 sm:px-3">Year</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('all')} className="text-xs sm:text-sm px-2 sm:px-3">All</Button>
          </div>

          {/* Custom Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span className="text-xs sm:text-sm">
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'MMM d, yyyy')
                    )
                  ) : (
                    'Custom Range'
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          {/* Venture Filter */}
          <Select value={selectedVenture} onValueChange={setSelectedVenture}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Ventures" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ventures</SelectItem>
              {ventures.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Project Filter */}
          {selectedVenture !== 'all' && (
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.filter(p => p.venture_id === selectedVenture).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-6">
        {/* Productivity Metrics */}
        <ProductivityMetrics items={filteredItems} users={users} />

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectProgressChart 
            items={filteredItems} 
            projects={projects} 
            ventures={ventures}
          />
          <CompletionTrends items={filteredItems} dateRange={dateRange} />
        </div>

        {/* STEP Analysis */}
        <StepAnalysisChart items={filteredItems} />
      </div>
    </div>
  );
}
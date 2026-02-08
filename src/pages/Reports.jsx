import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Plus, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { format, startOfMonth, startOfWeek, startOfYear, subMonths, parseISO, isWithinInterval } from 'date-fns';
import ReportBuilder from '../components/reports/ReportBuilder';
import ReportChart from '../components/reports/ReportChart';
import ExportOptions from '../components/reports/ExportOptions';

export default function ReportsPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [selectedVenture, setSelectedVenture] = useState('all');
  const [selectedMetrics, setSelectedMetrics] = useState(['task_completion', 'productivity', 'status_breakdown']);
  const [chartType, setChartType] = useState('bar');

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

    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = parseISO(item.created_date);
        return isWithinInterval(itemDate, { start: dateRange.from, end: dateRange.to });
      });
    }

    return filtered;
  }, [items, selectedVenture, dateRange]);

  const reportData = useMemo(() => {
    const tasks = filteredItems.filter(i => i.type === 'task');
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const notStarted = tasks.filter(t => t.status === 'not_started').length;
    const canceled = tasks.filter(t => t.status === 'canceled').length;

    return {
      totalItems: filteredItems.length,
      totalTasks: tasks.length,
      completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      statusBreakdown: {
        completed,
        in_progress: inProgress,
        not_started: notStarted,
        canceled,
      },
      ventureBreakdown: ventures.map(v => ({
        name: v.name,
        count: filteredItems.filter(i => i.venture_id === v.id).length,
        color: v.color,
      })).filter(v => v.count > 0),
      assigneeBreakdown: users.map(u => ({
        name: u.full_name || u.email,
        count: tasks.filter(t => t.assigned_to === u.email).length,
      })).filter(u => u.count > 0),
      stepBreakdown: {
        sextant: [1, 2, 3, 4, 5, 6].map(s => ({
          label: `S${s}`,
          count: tasks.filter(t => t.s_sextant === s).length,
        })),
        time: [1, 2, 3].map(t => ({
          label: `T${t}`,
          count: tasks.filter(task => task.t_time === t).length,
        })),
        effort: [1, 2, 3].map(e => ({
          label: `E${e}`,
          count: tasks.filter(t => t.e_effort === e).length,
        })),
        priority: [1, 2, 3].map(p => ({
          label: `P${p}`,
          count: tasks.filter(t => t.p_priority === p).length,
        })),
      },
    };
  }, [filteredItems, ventures, users]);

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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#323232] mb-2 tracking-tight" style={{fontFamily: 'Acherus Grotesque'}}>
          Custom Reports
        </h1>
        <p className="text-sm sm:text-base text-[#805c5c]" style={{fontFamily: 'Montserrat'}}>
          Build custom reports with flexible metrics and export options
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Report Settings</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBuilder(!showBuilder)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {showBuilder ? 'Hide' : 'Show'} Builder
              </Button>
              <ExportOptions data={reportData} filters={{ dateRange, selectedVenture }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuickRange('week')}>Week</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('month')}>Month</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('3months')}>3 Months</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('year')}>Year</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('all')}>All Time</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Custom Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
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
                      'Pick a date range'
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
              <SelectTrigger>
                <SelectValue placeholder="All Ventures" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ventures</SelectItem>
                {ventures.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Chart Type */}
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Report Builder */}
      {showBuilder && (
        <ReportBuilder
          selectedMetrics={selectedMetrics}
          onMetricsChange={setSelectedMetrics}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{reportData.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{reportData.totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{reportData.completionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{reportData.statusBreakdown.in_progress}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedMetrics.includes('status_breakdown') && (
          <ReportChart
            title="Status Breakdown"
            type={chartType}
            data={[
              { name: 'Completed', value: reportData.statusBreakdown.completed, color: '#10b981' },
              { name: 'In Progress', value: reportData.statusBreakdown.in_progress, color: '#3b82f6' },
              { name: 'Not Started', value: reportData.statusBreakdown.not_started, color: '#94a3b8' },
              { name: 'Canceled', value: reportData.statusBreakdown.canceled, color: '#ef4444' },
            ]}
          />
        )}

        {selectedMetrics.includes('venture_breakdown') && reportData.ventureBreakdown.length > 0 && (
          <ReportChart
            title="Items by Venture"
            type={chartType}
            data={reportData.ventureBreakdown.map(v => ({
              name: v.name,
              value: v.count,
              color: v.color,
            }))}
          />
        )}

        {selectedMetrics.includes('assignee_breakdown') && reportData.assigneeBreakdown.length > 0 && (
          <ReportChart
            title="Tasks by Assignee"
            type={chartType}
            data={reportData.assigneeBreakdown.map((u, i) => ({
              name: u.name,
              value: u.count,
              color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 6],
            }))}
          />
        )}

        {selectedMetrics.includes('step_analysis') && (
          <ReportChart
            title="STEP Analysis - Sextant"
            type="bar"
            data={reportData.stepBreakdown.sextant.map((s, i) => ({
              name: s.label,
              value: s.count,
              color: ['#ef4444', '#3b82f6', '#94a3b8', '#9ca3af', '#dc2626', '#6b7280'][i],
            }))}
          />
        )}
      </div>
    </div>
  );
}
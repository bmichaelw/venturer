import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const AVAILABLE_METRICS = [
  { id: 'status_breakdown', label: 'Status Breakdown', description: 'Task distribution by status' },
  { id: 'venture_breakdown', label: 'Venture Breakdown', description: 'Items across ventures' },
  { id: 'assignee_breakdown', label: 'Assignee Breakdown', description: 'Tasks by team member' },
  { id: 'step_analysis', label: 'STEP Analysis', description: 'Sextant distribution' },
  { id: 'task_completion', label: 'Task Completion', description: 'Completion metrics' },
  { id: 'productivity', label: 'Productivity Trends', description: 'Time-based analysis' },
];

export default function ReportBuilder({ selectedMetrics, onMetricsChange }) {
  const handleToggle = (metricId) => {
    if (selectedMetrics.includes(metricId)) {
      onMetricsChange(selectedMetrics.filter(m => m !== metricId));
    } else {
      onMetricsChange([...selectedMetrics, metricId]);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Select Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_METRICS.map(metric => (
            <div key={metric.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
              <Checkbox
                id={metric.id}
                checked={selectedMetrics.includes(metric.id)}
                onCheckedChange={() => handleToggle(metric.id)}
              />
              <div className="flex-1">
                <Label
                  htmlFor={metric.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {metric.label}
                </Label>
                <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
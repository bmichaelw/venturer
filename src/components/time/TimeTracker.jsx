import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Plus, Clock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TimeTracker({ item }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [manualMinutes, setManualMinutes] = useState('');
  const queryClient = useQueryClient();

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem(`timer_${item.id}`);
    if (savedTimer) {
      const { startTime, accumulatedSeconds } = JSON.parse(savedTimer);
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000) + accumulatedSeconds;
      setElapsedSeconds(elapsed);
      setIsRunning(true);
    }
  }, [item.id]);

  // Timer tick
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const updateTimeMutation = useMutation({
    mutationFn: async (additionalMinutes) => {
      const currentMinutes = item.actual_time_minutes || 0;
      const newTotal = currentMinutes + additionalMinutes;
      await base44.entities.Item.update(item.id, {
        actual_time_minutes: newTotal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Time logged successfully');
    },
  });

  const handleStartStop = () => {
    if (isRunning) {
      // Stop timer
      localStorage.removeItem(`timer_${item.id}`);
      
      // Log the time
      const minutes = Math.round(elapsedSeconds / 60);
      if (minutes > 0) {
        updateTimeMutation.mutate(minutes);
      }
      
      setElapsedSeconds(0);
      setIsRunning(false);
    } else {
      // Start timer
      const startTime = Date.now();
      localStorage.setItem(`timer_${item.id}`, JSON.stringify({
        startTime,
        accumulatedSeconds: 0,
      }));
      setIsRunning(true);
    }
  };

  const handleManualLog = () => {
    const minutes = parseInt(manualMinutes);
    if (minutes > 0) {
      updateTimeMutation.mutate(minutes);
      setManualMinutes('');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const estimatedMinutes = item.estimated_time_minutes || 0;
  const actualMinutes = item.actual_time_minutes || 0;
  const difference = actualMinutes - estimatedMinutes;

  return (
    <div className="space-y-4">
      {/* Active Timer */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">Timer</span>
          </div>
          {isRunning && (
            <span className="text-2xl font-mono font-semibold text-blue-600">
              {formatTime(elapsedSeconds)}
            </span>
          )}
        </div>
        <Button
          onClick={handleStartStop}
          disabled={updateTimeMutation.isPending}
          className={`w-full ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Stop & Log Time
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Timer
            </>
          )}
        </Button>
      </div>

      {/* Manual Time Entry */}
      <div className="space-y-2">
        <Label>Log Time Manually</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Minutes"
            value={manualMinutes}
            onChange={(e) => setManualMinutes(e.target.value)}
            className="flex-1"
            min="1"
          />
          <Button
            onClick={handleManualLog}
            disabled={!manualMinutes || updateTimeMutation.isPending}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log
          </Button>
        </div>
      </div>

      {/* Time Summary */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Estimated:</span>
          <span className="font-medium">{estimatedMinutes > 0 ? `${estimatedMinutes} min` : 'Not set'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Actual:</span>
          <span className="font-medium">{actualMinutes > 0 ? `${actualMinutes} min` : 'No time logged'}</span>
        </div>
        {estimatedMinutes > 0 && actualMinutes > 0 && (
          <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
            <span className="text-slate-600">Difference:</span>
            <span className={`font-semibold ${difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : 'text-slate-600'}`}>
              {difference > 0 ? '+' : ''}{difference} min
              {difference > 0 && ' over'}
              {difference < 0 && ' under'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
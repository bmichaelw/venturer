import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Clock } from 'lucide-react';
import { format, addMinutes, addHours, addDays, startOfDay } from 'date-fns';

export default function ReminderPicker({ value, onChange }) {
  const [date, setDate] = useState(value ? new Date(value) : null);
  const [time, setTime] = useState(value ? format(new Date(value), 'HH:mm') : '09:00');

  const quickOptions = [
    { label: '15 min', getValue: () => addMinutes(new Date(), 15) },
    { label: '1 hour', getValue: () => addHours(new Date(), 1) },
    { label: 'Tomorrow 9am', getValue: () => {
      const tomorrow = addDays(new Date(), 1);
      return new Date(tomorrow.setHours(9, 0, 0, 0));
    }},
    { label: 'Next week', getValue: () => {
      const nextWeek = addDays(new Date(), 7);
      return new Date(nextWeek.setHours(9, 0, 0, 0));
    }},
  ];

  const handleDateSelect = (selectedDate) => {
    if (!selectedDate) return;
    
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(selectedDate);
    combined.setHours(hours, minutes, 0, 0);
    
    setDate(combined);
    onChange(combined.toISOString());
  };

  const handleTimeChange = (newTime) => {
    setTime(newTime);
    
    if (date) {
      const [hours, minutes] = newTime.split(':').map(Number);
      const combined = new Date(date);
      combined.setHours(hours, minutes, 0, 0);
      onChange(combined.toISOString());
    }
  };

  const handleQuickOption = (getValue) => {
    const datetime = getValue();
    setDate(datetime);
    setTime(format(datetime, 'HH:mm'));
    onChange(datetime.toISOString());
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">Reminder</label>
      
      {/* Quick Options */}
      <div className="flex flex-wrap gap-2">
        {quickOptions.map((option) => (
          <Button
            key={option.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickOption(option.getValue)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Date & Time Picker */}
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1">
              <Bell className="w-4 h-4 mr-2" />
              {date ? format(date, 'MMM d, yyyy') : 'Pick date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {date && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Remind me: {format(date, 'MMM d, yyyy \'at\' h:mm a')}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDate(null);
              onChange(null);
            }}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
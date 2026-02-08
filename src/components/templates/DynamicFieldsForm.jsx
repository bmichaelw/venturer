import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DynamicFieldsForm({ fields = [], values = {}, onChange }) {
  const handleChange = (fieldId, value) => {
    onChange({ ...values, [fieldId]: value });
  };

  if (fields.length === 0) return null;

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
      <Label className="text-sm font-semibold text-slate-900">Additional Information</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-xs">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {field.type === 'text' && (
              <Input
                id={field.id}
                type="text"
                value={values[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="h-9"
              />
            )}
            {field.type === 'number' && (
              <Input
                id={field.id}
                type="number"
                value={values[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="h-9"
              />
            )}
            {field.type === 'date' && (
              <Input
                id={field.id}
                type="date"
                value={values[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                required={field.required}
                className="h-9"
              />
            )}
            {field.type === 'select' && (
              <Select
                value={values[field.id] || ''}
                onValueChange={(v) => handleChange(field.id, v)}
                required={field.required}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={field.placeholder || 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options || []).map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
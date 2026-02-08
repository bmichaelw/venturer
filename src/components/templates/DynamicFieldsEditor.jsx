import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DynamicFieldsEditor({ fields = [], onChange }) {
  const [editingField, setEditingField] = useState(null);

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      placeholder: '',
      required: false,
      options: [],
    };
    onChange([...fields, newField]);
    setEditingField(fields.length);
  };

  const updateField = (index, updates) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const deleteField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
    if (editingField === index) setEditingField(null);
  };

  const addOption = (fieldIndex) => {
    const newFields = [...fields];
    newFields[fieldIndex].options = [...(newFields[fieldIndex].options || []), ''];
    onChange(newFields);
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    const newFields = [...fields];
    newFields[fieldIndex].options[optionIndex] = value;
    onChange(newFields);
  };

  const deleteOption = (fieldIndex, optionIndex) => {
    const newFields = [...fields];
    newFields[fieldIndex].options = newFields[fieldIndex].options.filter((_, i) => i !== optionIndex);
    onChange(newFields);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Dynamic Fields</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addField}>
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Add custom fields to collect information when creating a project from this template
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500">
            No dynamic fields yet. Add fields to collect custom data during project creation.
          </div>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                  <div className="flex-1">
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="Field label..."
                      className="h-9"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteField(index)}
                  className="h-9 w-9 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>

              {editingField === index ? (
                <div className="space-y-3 pl-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(v) => updateField(index, { type: v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Placeholder</Label>
                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="e.g., Enter client name"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`required-${field.id}`}
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(index, { required: checked })}
                    />
                    <Label htmlFor={`required-${field.id}`} className="text-xs">
                      Required field
                    </Label>
                  </div>

                  {field.type === 'select' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Options</Label>
                      {(field.options || []).map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, optIndex, e.target.value)}
                            placeholder="Option text..."
                            className="h-8 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteOption(index, optIndex)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addOption(index)}
                        className="w-full h-8"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Option
                      </Button>
                    </div>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingField(null)}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingField(index)}
                  className="pl-6 text-xs text-slate-500 hover:text-slate-700"
                >
                  {field.type} • {field.required ? 'Required' : 'Optional'} • Click to edit
                </button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
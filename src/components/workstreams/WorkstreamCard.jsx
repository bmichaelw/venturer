import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Target, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function WorkstreamCard({ workstream, itemCount, onEdit, onDelete, onClick }) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-800'
  };

  const statusLabels = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    archived: 'Archived'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: workstream.color }}
            />
            <CardTitle className="text-lg font-semibold text-[#223947]">{workstream.title}</CardTitle>
          </div>
          <Badge className={statusColors[workstream.status]}>
            {statusLabels[workstream.status]}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {workstream.description && (
          <p className="text-sm text-gray-600 mb-3">{workstream.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {workstream.owner && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{workstream.owner}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>{itemCount} items</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
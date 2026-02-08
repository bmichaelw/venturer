import React from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function TemplateImportExport({ template }) {
  const queryClient = useQueryClient();

  const exportTemplate = () => {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        template: {
          name: template.name,
          description: template.description,
          category: template.category,
          icon_name: template.icon_name,
          color: template.color,
          estimated_duration_days: template.estimated_duration_days,
          milestones: template.milestones,
          dynamic_fields: template.dynamic_fields,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Template exported successfully');
    } catch (error) {
      toast.error('Failed to export template');
      console.error(error);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (templateData) => {
      return base44.entities.ProjectTemplate.create({
        ...templateData.template,
        name: `${templateData.template.name} (Imported)`,
        version: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success('Template imported successfully');
    },
    onError: () => {
      toast.error('Failed to import template');
    },
  });

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (!data.template || !data.version) {
              toast.error('Invalid template file format');
              return;
            }
            importMutation.mutate(data);
          } catch (error) {
            toast.error('Failed to parse template file');
            console.error(error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const shareTemplateMutation = useMutation({
    mutationFn: async (isShared) => {
      return base44.entities.ProjectTemplate.update(template.id, {
        is_shared: isShared,
      });
    },
    onSuccess: (_, isShared) => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success(isShared ? 'Template shared' : 'Template unshared');
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share & Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Export Template
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleImport}>
          <Upload className="w-4 h-4 mr-2" />
          Import Template
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => shareTemplateMutation.mutate(!template.is_shared)}
        >
          <Share2 className="w-4 h-4 mr-2" />
          {template.is_shared ? 'Unshare Template' : 'Share with Team'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
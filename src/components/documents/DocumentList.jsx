import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2, Upload as UploadIcon, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import DocumentUploader from './DocumentUploader';

export default function DocumentList({ entityType, entityId }) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: () => base44.entities.Document.filter({ 
      entity_type: entityType, 
      entity_id: entityId 
    }, '-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
    },
  });

  const uploadNewVersionMutation = useMutation({
    mutationFn: async ({ file, parentId }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const parentDoc = documents.find(d => d.id === parentId);
      
      await base44.entities.Document.create({
        name: parentDoc.name,
        file_url,
        file_type: file.type,
        file_size: file.size,
        entity_type: entityType,
        entity_id: entityId,
        version: (parentDoc.version || 1) + 1,
        parent_document_id: parentId,
        notes: `New version of ${parentDoc.name}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('New version uploaded');
      setSelectedDoc(null);
    },
  });

  const handleNewVersion = (docId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        uploadNewVersionMutation.mutate({ file, parentId: docId });
      }
    };
    input.click();
  };

  const getFileIcon = (fileType) => {
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Group documents by name (for versions)
  const groupedDocs = documents.reduce((acc, doc) => {
    const key = doc.parent_document_id || doc.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">
          Documents ({documents.length})
        </h4>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <UploadIcon className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <DocumentUploader
              entityType={entityType}
              entityId={entityId}
              onComplete={() => setUploadDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-stone-300 rounded-lg">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No documents attached</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedDocs).map(([key, docs]) => {
            const latestDoc = docs.sort((a, b) => (b.version || 1) - (a.version || 1))[0];
            const hasVersions = docs.length > 1;

            return (
              <div key={key} className="border border-stone-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  {getFileIcon(latestDoc.file_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-slate-900 truncate">
                        {latestDoc.name}
                      </h5>
                      <Badge variant="outline" className="text-xs">
                        v{latestDoc.version || 1}
                      </Badge>
                      {hasVersions && (
                        <Badge variant="secondary" className="text-xs">
                          {docs.length} versions
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(latestDoc.file_size)} • {format(parseISO(latestDoc.created_date), 'MMM d, yyyy')}
                    </p>
                    {latestDoc.notes && (
                      <p className="text-xs text-slate-600 mt-1">{latestDoc.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      asChild
                    >
                      <a href={latestDoc.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleNewVersion(latestDoc.id)}
                      title="Upload new version"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(latestDoc.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {hasVersions && (
                  <details className="mt-2 pt-2 border-t border-stone-200">
                    <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                      View all versions
                    </summary>
                    <div className="mt-2 space-y-2">
                      {docs.sort((a, b) => (b.version || 1) - (a.version || 1)).map(doc => (
                        <div key={doc.id} className="flex items-center justify-between text-xs pl-4">
                          <span className="text-slate-600">
                            v{doc.version || 1} • {format(parseISO(doc.created_date), 'MMM d, yyyy h:mm a')}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a href={doc.file_url} download>
                              <Download className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
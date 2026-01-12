import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentUploader({ entityType, entityId, onComplete }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');

      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Create document record
      await base44.entities.Document.create({
        name: name || file.name,
        file_url,
        file_type: file.type,
        file_size: file.size,
        entity_type: entityType,
        entity_id: entityId,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
      setFile(null);
      setName('');
      setNotes('');
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast.error('Failed to upload document: ' + error.message);
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">Select File</Label>
        <Input
          id="file"
          type="file"
          onChange={handleFileChange}
          required
          disabled={uploadMutation.isPending}
        />
        {file && (
          <p className="text-xs text-slate-500">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Document Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter document name"
          disabled={uploadMutation.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this document"
          rows={2}
          disabled={uploadMutation.isPending}
        />
      </div>

      <Button
        type="submit"
        disabled={!file || uploadMutation.isPending}
        className="w-full"
      >
        {uploadMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </>
        )}
      </Button>
    </form>
  );
}
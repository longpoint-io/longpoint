import { useUploadContext } from '@/contexts/upload-context';
import { useClient } from '@/hooks/common/use-client';
import { SupportedMimeType } from '@longpoint/types';
import { Button } from '@longpoint/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@longpoint/ui/components/dialog';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Progress } from '@longpoint/ui/components/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@longpoint/ui/components/select';
import { cn } from '@longpoint/ui/utils';
import { formatBytes } from '@longpoint/utils/format';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircleIcon,
  CheckIcon,
  FileIcon,
  ImageIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { ClassifierCombobox } from './classifier-combobox';

export function UploadDialog() {
  const {
    isOpen,
    files,
    closeDialog,
    addFiles,
    cancelUpload,
    reset,
    isUploading,
    hasFiles,
  } = useUploadContext();

  const client = useClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedClassifiers, setSelectedClassifiers] = useState<string[]>([]);
  const [selectedStorageUnitId, setSelectedStorageUnitId] = useState<
    string | undefined
  >(undefined);

  const { data: storageUnits } = useQuery({
    queryKey: ['storage-units'],
    queryFn: () => client.storage.listStorageUnits(),
  });

  const defaultStorageUnit = storageUnits?.items.find((unit) => unit.isDefault);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const newFiles = Array.from(e.dataTransfer.files);
        addFiles(newFiles, selectedClassifiers, selectedStorageUnitId);
      }
    },
    [addFiles, selectedClassifiers, selectedStorageUnitId]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const newFiles = Array.from(e.target.files);
        addFiles(newFiles, selectedClassifiers, selectedStorageUnitId);
      }
    },
    [addFiles, selectedClassifiers, selectedStorageUnitId]
  );

  const handleClose = useCallback(() => {
    closeDialog();
    reset();
  }, [closeDialog, reset]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="h-8 w-8 rounded object-cover"
        />
      );
    }
    return (
      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
        {getFileIcon(file)}
      </div>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckIcon className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircleIcon className="h-4 w-4 text-red-600" />;
      case 'uploading':
        return (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        );
      default:
        return null;
    }
  };

  // State 1: File picking view (when no files have been added)
  if (!hasFiles) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Drag and drop files here or click to select files to upload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Dropzone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Drop files here or click to browse
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Select Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={Object.values(SupportedMimeType).join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="storage-unit-select">
                Storage Unit (Optional)
              </FieldLabel>
              <Select
                value={selectedStorageUnitId || defaultStorageUnit?.id || ''}
                onValueChange={(value) =>
                  setSelectedStorageUnitId(value || undefined)
                }
              >
                <SelectTrigger id="storage-unit-select">
                  <SelectValue placeholder="Use default storage unit" />
                </SelectTrigger>
                <SelectContent>
                  {storageUnits?.items.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                      {unit.isDefault && ' (Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Select a storage unit for these uploads. If not specified, the
                default storage unit will be used.
              </FieldDescription>
            </Field>
            <ClassifierCombobox
              value={selectedClassifiers}
              onChange={setSelectedClassifiers}
            />
          </FieldGroup>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // State 2: Processing view (when files are being uploaded or completed)
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Uploading Files</DialogTitle>
          <DialogDescription>
            {isUploading ? 'Files are being uploaded...' : 'Upload completed'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {files.map((item) => {
              const file = item.file;
              const status = item.status;
              const progress = item.progress;
              const error = item.error;
              const fileId = item.id;

              return (
                <div
                  key={fileId}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  {/* Preview */}
                  {getFilePreview(file)}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{file.name}</p>
                      {getStatusIcon(status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{file.type}</span>
                      <span>{formatBytes(file.size)}</span>
                    </div>

                    {/* Progress Bar */}
                    {status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress}% uploaded
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {status === 'error' && error && (
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    )}
                  </div>

                  {/* Cancel Button */}
                  {status === 'uploading' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelUpload(fileId)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

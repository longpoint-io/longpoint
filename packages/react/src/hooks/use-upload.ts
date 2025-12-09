import { useCallback, useState } from 'react';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  abortController?: AbortController;
}

export interface UseUploadReturn {
  files: UploadFile[];
  uploadFile: (file: File, endpoint: string) => Promise<void>;
  uploadFiles: (files: File[], endpoint: string) => Promise<void>;
  addErrorFile: (file: File, error: string) => void;
  cancelUpload: (fileId: string) => void;
  reset: () => void;
  isUploading: boolean;
}

export function useUpload(): UseUploadReturn {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const uploadFile = useCallback(
    async (file: File, endpoint: string): Promise<void> => {
      const fileId = `${file.name}-${file.size}-${Date.now()}`;
      const abortController = new AbortController();

      // Add file to state
      const uploadFile: UploadFile = {
        id: fileId,
        file,
        progress: 0,
        status: 'pending',
        abortController,
      };

      setFiles((prev) => [...prev, uploadFile]);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Update progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? { ...f, progress, status: 'uploading' as const }
                  : f
              )
            );
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? { ...f, status: 'success' as const, progress: 100 }
                  : f
              )
            );
            resolve();
          } else {
            const error = `Upload failed: ${xhr.statusText}`;
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId ? { ...f, status: 'error' as const, error } : f
              )
            );
            reject(new Error(error));
          }
        });

        xhr.addEventListener('error', () => {
          const error = 'Upload failed due to network error';
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, status: 'error' as const, error } : f
            )
          );
          reject(new Error(error));
        });

        xhr.addEventListener('abort', () => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, status: 'error' as const, error: 'Upload cancelled' }
                : f
            )
          );
          reject(new Error('Upload cancelled'));
        });

        // Handle abort signal
        abortController.signal.addEventListener('abort', () => {
          xhr.abort();
        });

        xhr.open('PUT', endpoint);
        xhr.setRequestHeader('Content-Length', file.size.toString());
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    },
    []
  );

  const uploadFiles = useCallback(
    async (files: File[], endpoint: string): Promise<void> => {
      const uploadPromises = files.map((file) => uploadFile(file, endpoint));
      await Promise.allSettled(uploadPromises);
    },
    [uploadFile]
  );

  const addErrorFile = useCallback((file: File, error: string) => {
    const fileId = `${file.name}-${file.size}-${Date.now()}`;
    const errorFile: UploadFile = {
      id: fileId,
      file,
      progress: 0,
      status: 'error',
      error,
    };
    setFiles((prev) => [...prev, errorFile]);
  }, []);

  const cancelUpload = useCallback((fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId && f.abortController) {
          f.abortController.abort();
          return { ...f, status: 'error' as const, error: 'Upload cancelled' };
        }
        return f;
      })
    );
  }, []);

  const reset = useCallback(() => {
    // Cancel all active uploads
    files.forEach((f) => {
      if (f.abortController && f.status === 'uploading') {
        f.abortController.abort();
      }
    });
    setFiles([]);
  }, [files]);

  const isUploading = files.some((f) => f.status === 'uploading');

  return {
    files,
    uploadFile,
    uploadFiles,
    addErrorFile,
    cancelUpload,
    reset,
    isUploading,
  };
}

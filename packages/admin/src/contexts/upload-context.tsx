import { useClient } from '@/hooks/common/use-client';
import { useUpload, type UploadFile } from '@longpoint/react';
import { SupportedMimeType } from '@longpoint/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface UploadContextType {
  isOpen: boolean;
  files: UploadFile[];
  openDialog: (files?: File[]) => void;
  closeDialog: () => void;
  addFiles: (
    files: File[],
    classifiers?: string[],
    storageUnitId?: string
  ) => void;
  uploadFiles: (
    files: File[],
    classifiers?: string[],
    storageUnitId?: string
  ) => Promise<void>;
  cancelUpload: (fileId: string) => void;
  reset: () => void;
  isUploading: boolean;
  hasFiles: boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

interface UploadProviderProps {
  children: ReactNode;
}

export function UploadProvider({ children }: UploadProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const client = useClient();
  const uploadHook = useUpload();
  const queryClient = useQueryClient();
  const hasInvalidatedRef = useRef(false);

  const openDialog = useCallback((files?: File[]) => {
    setIsOpen(true);
    if (files && files.length > 0) {
      setPendingFiles(files);
    }
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setPendingFiles([]);
    uploadHook.reset();
  }, [uploadHook]);

  const uploadFiles = useCallback(
    async (
      files: File[],
      classifiers: string[] = [],
      storageUnitId?: string
    ): Promise<void> => {
      try {
        const supportedFiles = files.filter((file) => {
          const mimeType = file.type as SupportedMimeType;
          return Object.values(SupportedMimeType).includes(mimeType);
        });

        if (supportedFiles.length === 0) {
          throw new Error('No supported files selected');
        }

        setPendingFiles((prev) =>
          prev.filter(
            (pendingFile) =>
              !supportedFiles.some(
                (file) =>
                  file.name === pendingFile.name &&
                  file.size === pendingFile.size &&
                  file.type === pendingFile.type
              )
          )
        );

        const uploadPromises = supportedFiles.map(async (file) => {
          try {
            const asset = await client.assets.createAsset({
              mimeType: file.type as SupportedMimeType,
              name: file.name,
              classifiersOnUpload: classifiers,
              storageUnitId,
            });

            await uploadHook.uploadFile(file, asset.url);
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            const errorMessage =
              error instanceof Error ? error.message : 'Upload failed';
            uploadHook.addErrorFile(file, errorMessage);
            throw error;
          }
        });

        await Promise.allSettled(uploadPromises);
      } catch (error) {
        console.error('Upload failed:', error);
        throw error;
      }
    },
    [client, uploadHook]
  );

  const addFiles = useCallback(
    async (
      files: File[],
      classifiers: string[] = [],
      storageUnitId?: string
    ) => {
      setPendingFiles((prev) => [...prev, ...files]);
      try {
        await uploadFiles(files, classifiers, storageUnitId);
      } catch (error) {
        console.error('Auto-upload failed:', error);
      }
    },
    [uploadFiles]
  );

  const cancelUpload = useCallback(
    (fileId: string) => {
      uploadHook.cancelUpload(fileId);
    },
    [uploadHook]
  );

  const reset = useCallback(() => {
    uploadHook.reset();
    setPendingFiles([]);
    hasInvalidatedRef.current = false;
  }, [uploadHook]);

  const allFiles = [
    ...pendingFiles.map((file) => ({
      id: `pending-${file.name}-${file.size}`,
      file,
      progress: 0,
      status: 'pending' as const,
    })),
    ...uploadHook.files,
  ];

  // Invalidate queries when uploads complete
  useEffect(() => {
    if (allFiles.length === 0) {
      hasInvalidatedRef.current = false;
      return;
    }

    // Check if all uploads are complete (success or error, not pending or uploading)
    const allComplete = allFiles.every(
      (file) => file.status === 'success' || file.status === 'error'
    );

    // Check if there are any successful uploads
    const hasSuccessfulUploads = allFiles.some(
      (file) => file.status === 'success'
    );

    if (allComplete && hasSuccessfulUploads && !hasInvalidatedRef.current) {
      // Invalidate library tree queries to refresh the media list
      queryClient.invalidateQueries({ queryKey: ['media-containers'] });
      hasInvalidatedRef.current = true;
    }
  }, [allFiles, queryClient]);

  const value: UploadContextType = {
    isOpen,
    files: allFiles,
    openDialog,
    closeDialog,
    addFiles,
    uploadFiles,
    cancelUpload,
    reset,
    isUploading: uploadHook.isUploading,
    hasFiles: allFiles.length > 0,
  };

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
}

export function useUploadContext(): UploadContextType {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploadContext must be used within an UploadProvider');
  }
  return context;
}

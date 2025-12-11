import type { components } from '@longpoint/sdk';
import { Longpoint } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@longpoint/ui/components/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@longpoint/ui/components/tooltip';
import { cn } from '@longpoint/ui/lib/utils';
import { formatBytes } from '@longpoint/utils/format';
import {
  BookmarkIcon,
  Download,
  EditIcon,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AddToCollectionCombobox } from './add-to-collection-combobox';
import { SelectTransformTemplate } from './select-transform-template';

type AssetDetailsHeaderProps = {
  asset: components['schemas']['Asset'];
  canUpdate: boolean;
  canDelete: boolean;
  selectedVariant: components['schemas']['Asset']['original'] | undefined;
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onAddToCollection: (collectionIds: string[]) => void;
  onGenerateVariant: (templateId: string) => void;
  client: Longpoint;
  addToCollectionOpen: boolean;
  setAddToCollectionOpen: (open: boolean) => void;
  generateVariantOpen: boolean;
  setGenerateVariantOpen: (open: boolean) => void;
  updateCollectionsMutationPending: boolean;
  generateVariantMutationPending: boolean;
};

export function AssetDetailsHeader({
  asset,
  canUpdate,
  canDelete,
  selectedVariant,
  onRename,
  onDelete,
  onDownload,
  onAddToCollection,
  onGenerateVariant,
  client,
  addToCollectionOpen,
  setAddToCollectionOpen,
  generateVariantOpen,
  setGenerateVariantOpen,
  updateCollectionsMutationPending,
  generateVariantMutationPending,
}: AssetDetailsHeaderProps) {
  const hasDerivatives = asset?.derivatives && asset.derivatives.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{asset.name}</h2>
        <div className="flex items-center gap-2">
          <Popover
            open={addToCollectionOpen}
            onOpenChange={setAddToCollectionOpen}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="icon"
                    disabled={updateCollectionsMutationPending}
                  >
                    <BookmarkIcon
                      className={cn(
                        asset.collections.length > 0
                          ? 'fill-destructive stroke-destructive'
                          : ''
                      )}
                    />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Edit Collections</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-[300px] p-0" align="end">
              <AddToCollectionCombobox
                client={client}
                asset={asset}
                onApply={(collectionIds) => {
                  onAddToCollection(collectionIds);
                }}
                onClose={() => setAddToCollectionOpen(false)}
              />
            </PopoverContent>
          </Popover>
          {canUpdate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="icon" onClick={onRename}>
                  <EditIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="icon"
                onClick={onDownload}
                disabled={
                  !selectedVariant?.url || selectedVariant.status !== 'READY'
                }
              >
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
          <Popover
            open={generateVariantOpen}
            onOpenChange={setGenerateVariantOpen}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="icon"
                    disabled={
                      !selectedVariant?.id ||
                      selectedVariant.status !== 'READY' ||
                      generateVariantMutationPending
                    }
                  >
                    <Sparkles />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Generate Variant</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-[300px] p-0" align="end">
              <SelectTransformTemplate
                client={client}
                selectedVariantMimeType={selectedVariant?.mimeType ?? ''}
                onSelect={(templateId) => {
                  onGenerateVariant(templateId);
                }}
                onClose={() => setGenerateVariantOpen(false)}
              />
            </PopoverContent>
          </Popover>
          {canDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="icon" onClick={onDelete}>
                  <Trash2 className="text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">ID:</span>
          <div className="relative flex items-center gap-2">
            <span className="font-mono select-all">{asset.id}</span>
          </div>
        </div>
        <span>•</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">Created:</span>
          <span>{new Date(asset.createdAt).toLocaleString()}</span>
        </div>
        {hasDerivatives && (
          <>
            <span>•</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {asset.derivatives.length + 1} variants
              </span>
            </div>
          </>
        )}
        <span>•</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">Total Size:</span>
          <span>{formatBytes(asset.totalSize)}</span>
        </div>
      </div>
    </div>
  );
}

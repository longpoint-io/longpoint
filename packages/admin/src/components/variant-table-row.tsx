import { AssetType } from '@/components/asset-type';
import type { components } from '@longpoint/sdk';
import { Badge } from '@longpoint/ui/components/badge';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import { TableCell, TableRow } from '@longpoint/ui/components/table';
import { formatBytes } from '@longpoint/utils/format';
import { enumToTitleCase } from '@longpoint/utils/string';
import { ImageIcon, VideoIcon } from 'lucide-react';

export type VariantWithType = components['schemas']['AssetVariant'] & {
  variantType: 'ORIGINAL' | 'DERIVATIVE' | 'THUMBNAIL';
};

interface VariantTableRowProps {
  variant: VariantWithType;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  multiSelect?: boolean;
  onVariantClick?: (variantId: string) => void;
}

const getStatusBadgeVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'READY':
      return 'default';
    case 'PROCESSING':
      return 'secondary';
    case 'FAILED':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getVariantTypeLabel = (type: 'ORIGINAL' | 'DERIVATIVE' | 'THUMBNAIL') => {
  switch (type) {
    case 'ORIGINAL':
      return 'Original';
    case 'DERIVATIVE':
      return 'Derivative';
    case 'THUMBNAIL':
      return 'Thumbnail';
  }
};

export function VariantTableRow({
  variant,
  selected = false,
  onSelectChange,
  multiSelect = false,
  onVariantClick,
}: VariantTableRowProps) {
  const {
    id,
    displayName,
    status,
    mimeType,
    width,
    height,
    size,
    variantType,
    url,
  } = variant;

  const isImage = mimeType?.startsWith('image/') ?? false;
  const isVideo = mimeType?.startsWith('video/') ?? false;
  const showImagePreview = isImage && status === 'READY' && url;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectChange?.(!selected);
  };

  const handleRowClick = () => {
    if (!multiSelect && onVariantClick) {
      onVariantClick(id);
    }
  };

  const displayNameText =
    displayName ||
    (variantType === 'ORIGINAL'
      ? 'Original'
      : `${getVariantTypeLabel(variantType)} ${id.slice(0, 8)}`);

  return (
    <TableRow
      className={onVariantClick ? 'cursor-pointer hover:bg-muted/50' : ''}
      onClick={handleRowClick}
    >
      {multiSelect && (
        <TableCell onClick={handleCheckboxClick}>
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(checked === true)}
            onClick={handleCheckboxClick}
          />
        </TableCell>
      )}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="size-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded overflow-hidden shrink-0">
            {showImagePreview ? (
              <img
                src={url ?? undefined}
                alt={displayNameText}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isVideo ? (
                  <VideoIcon
                    className="w-5 h-5 text-gray-400"
                    strokeWidth={1.5}
                  />
                ) : (
                  <ImageIcon
                    className="w-5 h-5 text-gray-400"
                    strokeWidth={1.5}
                  />
                )}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-semibold truncate"
              title={displayNameText}
            >
              {displayNameText}
            </p>
            <p className="text-xs text-muted-foreground">
              <AssetType type={mimeType} showText={true} showIcon={false} />
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {getVariantTypeLabel(variantType)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={getStatusBadgeVariant(status)}
          className="w-fit text-xs"
        >
          {enumToTitleCase(status)}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {width && height ? `${width} × ${height}` : '-'}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {size ? formatBytes(size) : '-'}
      </TableCell>
    </TableRow>
  );
}

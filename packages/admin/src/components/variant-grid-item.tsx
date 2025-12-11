import { AssetType } from '@/components/asset-type';
import { Badge } from '@longpoint/ui/components/badge';
import { Card, CardContent } from '@longpoint/ui/components/card';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import { cn } from '@longpoint/ui/utils';
import { enumToTitleCase } from '@longpoint/utils/string';
import { ImageIcon, VideoIcon } from 'lucide-react';
import { VariantWithType } from './variant-table-row';

interface VariantGridItemProps {
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

export function VariantGridItem({
  variant,
  selected = false,
  onSelectChange,
  multiSelect = false,
  onVariantClick,
}: VariantGridItemProps) {
  const { id, displayName, status, mimeType, variantType, url } = variant;

  const isImage = mimeType?.startsWith('image/') ?? false;
  const isVideo = mimeType?.startsWith('video/') ?? false;
  const isReady = status === 'READY';
  const showImagePreview = isImage && isReady && url;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectChange?.(!selected);
  };

  const handleCardClick = () => {
    if (!multiSelect && onVariantClick) {
      onVariantClick(id);
    }
  };

  const displayNameText =
    displayName ||
    (variantType === 'ORIGINAL'
      ? 'Original'
      : `${getVariantTypeLabel(variantType)} ${id.slice(0, 8)}`);

  const content = (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group overflow-hidden relative',
        onVariantClick ? '' : 'cursor-default'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="flex flex-col">
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-200 transition-colors relative overflow-hidden">
            {multiSelect && (
              <div
                className={cn(
                  'absolute top-2 left-2 z-10 transition-opacity',
                  selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
                onClick={handleCheckboxClick}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) =>
                    onSelectChange?.(checked === true)
                  }
                  onClick={handleCheckboxClick}
                  className="bg-background/90 backdrop-blur-sm"
                />
              </div>
            )}
            {showImagePreview ? (
              <img
                src={url ?? undefined}
                alt={displayNameText}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isVideo ? (
                  <VideoIcon
                    className="w-16 h-16 text-gray-400"
                    strokeWidth={1.5}
                  />
                ) : (
                  <ImageIcon
                    className="w-16 h-16 text-gray-400"
                    strokeWidth={1.5}
                  />
                )}
              </div>
            )}
            {!isReady && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  {enumToTitleCase(status)}
                </Badge>
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <div className="text-center space-y-2 flex flex-col items-center justify-center">
              <p
                className="text-sm font-semibold truncate group-hover:text-gray-900 transition-colors"
                title={displayNameText}
              >
                {displayNameText}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getVariantTypeLabel(variantType)}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  <AssetType type={mimeType} showText={true} showIcon={false} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return <div className="block">{content}</div>;
}

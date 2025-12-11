import { components } from '@longpoint/sdk';
import { cn } from '@longpoint/ui/lib/utils';
import { enumToTitleCase } from '@longpoint/utils/string';
import { ImageIcon, VideoIcon } from 'lucide-react';

export interface AssetTypeProps {
  type: components['schemas']['Asset']['type'] | string;
  className?: string;
  showText?: boolean;
  showIcon?: boolean;
}

export function AssetType({
  type,
  className,
  showText = true,
  showIcon = true,
}: AssetTypeProps) {
  const assetType = enumToTitleCase(type);
  const normalizedType = type.toLowerCase().split('/')[0];

  let icon = null;
  switch (normalizedType) {
    case 'image':
      icon = <ImageIcon className="h-4 w-4 text-muted-foreground" />;
      break;
    case 'video':
      icon = <VideoIcon className="h-4 w-4 text-muted-foreground" />;
      break;
    default:
      icon = null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && icon}
      {showText && <span className="text-sm capitalize">{assetType}</span>}
    </div>
  );
}

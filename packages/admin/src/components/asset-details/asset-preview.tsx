import type { components } from '@longpoint/sdk';
import { Card, CardContent } from '@longpoint/ui/components/card';
import { ImageIcon, VideoIcon } from 'lucide-react';
import { useAssetDetailsStore } from './asset-details-store';

type AssetPreviewProps = {
  asset: components['schemas']['Asset'];
  isVideo: boolean;
};

export function AssetPreview({ asset, isVideo }: AssetPreviewProps) {
  const { selectedVariantId } = useAssetDetailsStore();

  // Get the currently selected variant
  const selectedVariant =
    selectedVariantId === 'original'
      ? asset?.original
      : asset?.derivatives?.find((d) => d.id === selectedVariantId) ||
        asset?.thumbnails?.find((t) => t.id === selectedVariantId);

  // Determine if the selected variant is a video based on its MIME type
  // This ensures thumbnails (which are images) are rendered correctly
  const isSelectedVariantVideo =
    selectedVariant?.mimeType?.startsWith('video/') ?? isVideo;

  return (
    <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
      <Card>
        <CardContent className="space-y-4">
          {selectedVariant?.url && selectedVariant.status === 'READY' ? (
            <div className="relative w-full bg-muted rounded-lg overflow-hidden">
              {isSelectedVariantVideo ? (
                <video
                  src={selectedVariant.url}
                  controls
                  className="w-full h-auto max-h-[600px]"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={selectedVariant.url}
                  alt={asset.name}
                  className="w-full h-auto max-h-[600px] object-contain mx-auto"
                />
              )}
            </div>
          ) : (
            <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                {isSelectedVariantVideo ? (
                  <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                )}
                <p className="text-sm text-muted-foreground">
                  {selectedVariant?.status === 'PROCESSING'
                    ? 'Processing...'
                    : selectedVariant?.status === 'FAILED'
                    ? 'Failed to load'
                    : 'No preview available'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

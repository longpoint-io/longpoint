import { AssetType } from '@/components/asset-type';
import type { components } from '@longpoint/sdk';
import { Badge } from '@longpoint/ui/components/badge';
import { Card, CardContent } from '@longpoint/ui/components/card';
import { Field, FieldGroup, FieldLabel } from '@longpoint/ui/components/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@longpoint/ui/components/select';
import { formatBytes, formatDuration } from '@longpoint/utils/format';
import { enumToTitleCase } from '@longpoint/utils/string';
import { useAssetDetailsStore } from './asset-details-store';

type AssetDetailsPanelProps = {
  asset: components['schemas']['AssetDetails'];
};

const getStatusBadgeVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'READY':
      return 'default';
    case 'PROCESSING':
      return 'secondary';
    case 'FAILED':
    case 'PARTIALLY_FAILED':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function AssetDetailsPanel({ asset }: AssetDetailsPanelProps) {
  const { selectedVariantId, setSelectedVariantId } = useAssetDetailsStore();

  const selectedVariant =
    selectedVariantId === 'original'
      ? asset?.original
      : asset?.derivatives?.find((d) => d.id === selectedVariantId) ||
        asset?.thumbnails?.find((t) => t.id === selectedVariantId);

  const versionOptions = [
    { value: 'original', label: 'Original' },
    ...(asset?.derivatives?.map((d) => ({
      value: d.id,
      label: d.displayName || `Derivative ${d.id.slice(0, 8)}`,
    })) || []),
  ];

  return (
    <div className="lg:col-span-3">
      <Card>
        <CardContent>
          <div className="mb-6">
            <Field>
              <FieldLabel>Variant</FieldLabel>
              <Select
                value={selectedVariantId}
                onValueChange={setSelectedVariantId}
              >
                <SelectTrigger
                  className="max-w-[240px]"
                  disabled={asset.totalVariants === 1}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Versions</SelectLabel>
                    {versionOptions.map((option) => {
                      // Get the variant data for this option
                      const variant =
                        option.value === 'original'
                          ? asset?.original
                          : asset?.derivatives?.find(
                              (d) => d.id === option.value
                            );

                      // Determine if we should show image preview or icon
                      const isImage =
                        variant?.mimeType?.startsWith('image/') ?? false;
                      const showImagePreview =
                        isImage && variant?.status === 'READY' && variant?.url;

                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2.5">
                            {showImagePreview ? (
                              <img
                                src={variant.url ?? undefined}
                                alt={option.label}
                                className="h-6 w-6 object-cover rounded flex-shrink-0"
                              />
                            ) : variant?.mimeType ? (
                              <AssetType
                                type={variant.mimeType}
                                showText={false}
                              />
                            ) : null}
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                  {asset?.thumbnails?.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Thumbnails</SelectLabel>
                      {asset?.thumbnails?.map((thumbnail) => {
                        const showImagePreview =
                          thumbnail.status === 'READY' && thumbnail.url;

                        return (
                          <SelectItem key={thumbnail.id} value={thumbnail.id}>
                            <div className="flex items-center gap-2.5">
                              {showImagePreview ? (
                                <img
                                  src={thumbnail.url ?? undefined}
                                  alt={
                                    thumbnail.displayName ||
                                    `Thumbnail ${thumbnail.id.slice(0, 8)}`
                                  }
                                  className="h-6 w-6 object-cover rounded flex-shrink-0"
                                />
                              ) : null}
                              <span>
                                {thumbnail.displayName ||
                                  `Thumbnail ${thumbnail.id.slice(0, 8)}`}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {selectedVariant ? (
            <FieldGroup>
              <Field>
                <FieldLabel>MIME Type</FieldLabel>
                <p className="text-sm font-mono">{selectedVariant.mimeType}</p>
              </Field>
              {selectedVariant.width && selectedVariant.height && (
                <>
                  <Field>
                    <FieldLabel>Dimensions</FieldLabel>
                    <p className="text-sm">
                      {selectedVariant.width} × {selectedVariant.height} pixels
                    </p>
                  </Field>
                  {selectedVariant.aspectRatio && (
                    <Field>
                      <FieldLabel>Aspect Ratio</FieldLabel>
                      <p className="text-sm">
                        {parseFloat(
                          selectedVariant.aspectRatio.toFixed(2)
                        ).toString()}
                        &nbsp;:&nbsp;1
                      </p>
                    </Field>
                  )}
                </>
              )}
              {selectedVariant.size && (
                <Field>
                  <FieldLabel>File Size</FieldLabel>
                  <p className="text-sm">{formatBytes(selectedVariant.size)}</p>
                </Field>
              )}
              {selectedVariant.duration && (
                <Field>
                  <FieldLabel>Duration</FieldLabel>
                  <p className="text-sm">
                    {formatDuration(selectedVariant.duration, 'compact')}
                  </p>
                </Field>
              )}
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Badge
                  variant={getStatusBadgeVariant(selectedVariant.status)}
                  className="w-fit!"
                >
                  {enumToTitleCase(selectedVariant.status)}
                </Badge>
              </Field>
              {selectedVariant.metadata &&
                Object.keys(selectedVariant.metadata).length > 0 && (
                  <>
                    {Object.entries(selectedVariant.metadata).map(
                      ([key, value]) => (
                        <Field key={key}>
                          <FieldLabel className="capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </FieldLabel>
                          <div className="text-sm text-muted-foreground">
                            {Array.isArray(value) ? (
                              <div className="flex flex-wrap gap-2">
                                {value.map((item: unknown, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {String(item)}
                                  </Badge>
                                ))}
                              </div>
                            ) : typeof value === 'object' && value !== null ? (
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <p>{String(value)}</p>
                            )}
                          </div>
                        </Field>
                      )
                    )}
                  </>
                )}
            </FieldGroup>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No variant information available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

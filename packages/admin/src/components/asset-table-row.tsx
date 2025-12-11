import { components } from '@longpoint/sdk';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import { TableCell, TableRow } from '@longpoint/ui/components/table';
import { ImageIcon, VideoIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AssetType } from './asset-type';

interface AssetTableRowProps {
  item: components['schemas']['AssetSummary'];
  thumbnailLink?: string;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  multiSelect?: boolean;
}

export function AssetTableRow({
  item,
  thumbnailLink: thumbnailLinkOverride,
  selected = false,
  onSelectChange,
  multiSelect = false,
}: AssetTableRowProps) {
  const navigate = useNavigate();

  const { id, name, createdAt, updatedAt, type, thumbnails } = item;
  const isVideo = type === 'VIDEO';

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectChange?.(!selected);
  };

  const thumbnailLink = thumbnailLinkOverride ?? thumbnails[0]?.url;

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/assets/${id}`)}
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
            {thumbnailLink ? (
              <img
                src={thumbnailLink}
                alt={name}
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
            <p className="text-sm font-semibold truncate" title={name}>
              {name}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <AssetType type={type} />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {updatedAt ? new Date(updatedAt).toLocaleString() : '-'}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {createdAt ? new Date(createdAt).toLocaleString() : '-'}
      </TableCell>
    </TableRow>
  );
}

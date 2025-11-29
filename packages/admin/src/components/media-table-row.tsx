import { components } from '@longpoint/sdk';
import { Badge } from '@longpoint/ui/components/badge';
import { TableCell, TableRow } from '@longpoint/ui/components/table';
import { FolderIcon, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MediaType } from './media-type';

interface MediaTableRowProps {
  item: components['schemas']['MediaTree']['items'][number];
  onFolderClick?: (path: string) => void;
  thumbnailLink?: string;
}

export function MediaTableRow({
  item,
  onFolderClick,
  thumbnailLink,
}: MediaTableRowProps) {
  const navigate = useNavigate();

  if (item.treeItemType === 'DIRECTORY') {
    const { path } = item;
    const folderName = path.split('/').pop() || 'Folder';

    return (
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => onFolderClick?.(path)}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded flex items-center justify-center shrink-0">
              <FolderIcon className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" title={folderName}>
                {folderName}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="text-xs">
            Folder
          </Badge>
        </TableCell>
        <TableCell>-</TableCell>
        <TableCell className="text-muted-foreground text-sm">-</TableCell>
      </TableRow>
    );
  }

  if (item.treeItemType === 'MEDIA') {
    const { id, name, createdAt, updatedAt, type } = item;

    return (
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => navigate(`/media/${id}`)}
      >
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
                  <ImageIcon
                    className="w-5 h-5 text-gray-400"
                    strokeWidth={1.5}
                  />
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
          <MediaType type={type} />
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

  return null;
}

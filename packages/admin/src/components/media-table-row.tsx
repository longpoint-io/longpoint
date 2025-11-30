import { components } from '@longpoint/sdk';
import { TableCell, TableRow } from '@longpoint/ui/components/table';
import { ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MediaType } from './media-type';

interface MediaTableRowProps {
  item: components['schemas']['MediaContainerSummary'];
  thumbnailLink?: string;
}

export function MediaTableRow({ item, thumbnailLink }: MediaTableRowProps) {
  const navigate = useNavigate();

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

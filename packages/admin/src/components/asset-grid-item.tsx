import { components } from '@longpoint/sdk';
import { Badge } from '@longpoint/ui/components/badge';
import { Card, CardContent } from '@longpoint/ui/components/card';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import { cn } from '@longpoint/ui/utils';
import { ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AssetGridItemProps {
  item: components['schemas']['AssetSummary'];
  thumbnailLink?: string;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  multiSelect?: boolean;
}

export function AssetGridItem({
  item,
  thumbnailLink,
  selected = false,
  onSelectChange,
  multiSelect = false,
}: AssetGridItemProps) {
  const { id, name, status } = item;
  const isReady = status === 'READY';

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectChange?.(!selected);
  };

  const content = (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group overflow-hidden relative">
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
            {thumbnailLink ? (
              <img
                src={thumbnailLink}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon
                  className="w-16 h-16 text-gray-400"
                  strokeWidth={1.5}
                />
              </div>
            )}
            {!isReady && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  {status}
                </Badge>
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <div className="text-center space-y-1">
              <p
                className="text-sm font-semibold truncate group-hover:text-gray-900 transition-colors"
                title={name}
              >
                {name}
              </p>
              <p className="text-xs text-muted-foreground">Media</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Link to={`/media/${id}`} className="block">
      {content}
    </Link>
  );
}

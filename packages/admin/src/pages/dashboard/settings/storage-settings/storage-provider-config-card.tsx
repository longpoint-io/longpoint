import { components } from '@longpoint/sdk';
import { Badge } from '@longpoint/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import { cn } from '@longpoint/ui/utils';
import { useNavigate } from 'react-router-dom';
import { StorageProviderIcon } from './storage-provider-icon';

interface StorageProviderConfigCardProps {
  config: components['schemas']['StorageConfig'];
}

export function StorageProviderConfigCard({
  config,
}: StorageProviderConfigCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/settings/storage/configs/${config.id}`);
  };

  return (
    <Card
      className={cn('cursor-pointer transition-colors hover:bg-accent')}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {config.name}
            </CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-2">
                <StorageProviderIcon image={config.provider.image} />
                <span>{config.provider.name}</span>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {config.storageUnitCount !== undefined && (
            <Badge variant="secondary">
              {config.storageUnitCount} unit
              {config.storageUnitCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

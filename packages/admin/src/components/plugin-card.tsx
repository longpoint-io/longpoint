import type { components } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import { cn } from '@longpoint/ui/utils';
import { PlugIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PluginSummary = components['schemas']['PluginSummary'];

interface PluginCardProps {
  plugin: PluginSummary;
}

export function PluginCard({ plugin }: PluginCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-center gap-3">
          {plugin.icon ? (
            <img
              src={plugin.icon}
              alt={plugin.displayName}
              className={cn('size-10 rounded object-contain')}
            />
          ) : (
            <div className="flex items-center justify-center size-10 rounded bg-muted">
              <PlugIcon className="size-5 text-muted-foreground" />
            </div>
          )}
          <CardTitle className="text-lg">{plugin.displayName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent
        onClick={() => navigate(`/plugins/${plugin.id}`)}
        className="space-y-3"
      >
        {plugin.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {plugin.description}
          </p>
        )}
        {plugin.type && (
          <div className="text-sm">
            <span className="text-muted-foreground">Type: </span>
            <span className="font-medium capitalize">{plugin.type}</span>
          </div>
        )}
        {plugin.hasSettings && (
          <div className="text-xs text-muted-foreground">
            Configurable settings available
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="ghost"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/plugins/${plugin.id}`);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

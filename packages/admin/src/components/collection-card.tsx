import type { components } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Collection = components['schemas']['Collection'];

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <CardTitle className="text-lg">{collection.name}</CardTitle>
      </CardHeader>
      <CardContent
        onClick={() => navigate(`/collections/${collection.id}`)}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Assets: </span>
          <span className="font-medium">{collection.assetCount}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="ghost"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/collections/${collection.id}`);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

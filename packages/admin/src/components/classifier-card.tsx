import type { components } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ClassifierSummary = components['schemas']['ClassifierSummary'];

interface ClassifierCardProps {
  classifier: ClassifierSummary;
}

export function ClassifierCard({ classifier }: ClassifierCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <CardTitle className="text-lg">{classifier.name}</CardTitle>
      </CardHeader>
      <CardContent
        onClick={() => navigate(`/classifiers/${classifier.id}`)}
        className="space-y-3"
      >
        {/* {classifier.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {classifier.description}
          </p>
        )} */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{new Date(classifier.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Model: </span>
          <span className="font-medium">{classifier.provider.displayName}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="ghost"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/classifiers/${classifier.id}`);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

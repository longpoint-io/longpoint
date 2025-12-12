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

type TransformTemplate = components['schemas']['TransformTemplate'];

interface TransformTemplateCardProps {
  template: TransformTemplate;
}

export function TransformTemplateCard({
  template,
}: TransformTemplateCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <CardTitle className="text-lg">{template.displayName}</CardTitle>
      </CardHeader>
      <CardContent
        onClick={() => navigate(`/transform/templates/${template.id}`)}
        className="space-y-3"
      >
        {template.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        )}
        {template.createdAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(template.createdAt).toLocaleDateString()}</span>
          </div>
        )}
        <div className="text-sm">
          <span className="text-muted-foreground">Transformer: </span>
          <span className="font-medium">{template.transformerId}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="ghost"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/transform/templates/${template.id}`);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

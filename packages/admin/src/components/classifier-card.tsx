import type { components } from '@longpoint/sdk';
import { Badge } from '@longpoint/ui/components/badge';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import { Clock, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ClassifierTemplate = components['schemas']['ClassifierTemplate'];

interface ClassifierCardProps {
  classifierTemplate: ClassifierTemplate;
}

export function ClassifierCard({ classifierTemplate }: ClassifierCardProps) {
  const navigate = useNavigate();
  const isPluginTemplate = classifierTemplate.source === 'plugin';
  const displayName = isPluginTemplate
    ? classifierTemplate.name
    : classifierTemplate.name;

  const handleClick = () => {
    if (!isPluginTemplate && classifierTemplate.id) {
      navigate(`/classifier-templates/${classifierTemplate.id}`);
    }
  };

  return (
    <Card
      className={`transition-shadow ${
        isPluginTemplate ? '' : 'hover:shadow-md cursor-pointer'
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{displayName}</CardTitle>
          {isPluginTemplate && (
            <Badge variant="secondary" className="text-xs">
              <Package className="h-3 w-3 mr-1" />
              Plugin
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent onClick={handleClick} className="space-y-3">
        {classifierTemplate.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {classifierTemplate.description}
          </p>
        )}
        {!isPluginTemplate && classifierTemplate.createdAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {new Date(classifierTemplate.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
        <div className="text-sm">
          <span className="text-muted-foreground">Model: </span>
          <span className="font-medium">
            {classifierTemplate.classifier.displayName}
          </span>
        </div>
      </CardContent>
      {!isPluginTemplate && classifierTemplate.id && (
        <CardFooter className="pt-0">
          <Button
            variant="ghost"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/classifier-templates/${classifierTemplate.id}`);
            }}
          >
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

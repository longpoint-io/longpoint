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
import { Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Rule = components['schemas']['Rule'];

interface RuleCardProps {
  rule: Rule;
}

export function RuleCard({ rule }: RuleCardProps) {
  const navigate = useNavigate();

  const triggerEventLabel = rule.triggerEvent.replace('.', ' ');

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{rule.displayName}</CardTitle>
          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
            {rule.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent
        onClick={() => navigate(`/rules/${rule.id}/edit`)}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{new Date(rule.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Trigger: </span>
            <span className="font-medium">{triggerEventLabel}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="ghost"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/rules/${rule.id}/edit`);
          }}
        >
          Edit Rule
        </Button>
      </CardFooter>
    </Card>
  );
}

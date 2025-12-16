import { useAuth } from '@/auth';
import { useClient } from '@/hooks/common/use-client';
import { Permission } from '@longpoint/types';
import { Button } from '@longpoint/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { FileCode, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RuleCard } from './rule-card';

export function Rules() {
  const client = useClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(Permission.RULES_CREATE);

  const { data, isLoading, error } = useQuery({
    queryKey: ['rules'],
    queryFn: () => client.rules.listRules(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Rules</h2>
            <p className="text-muted-foreground mt-2">
              Automate asset processing with conditional rules
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4 p-6 border rounded-lg">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Rules</h2>
            <p className="text-muted-foreground mt-2">
              Automate asset processing with conditional rules
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load rules</p>
        </div>
      </div>
    );
  }

  const rules = data?.items || [];
  const isEmpty = rules.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Rules</h2>
          <p className="text-muted-foreground mt-2">
            Automate asset processing with conditional rules
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/rules/create')}>
            <Plus className="h-4 w-4" />
            Create Rule
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileCode className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">No rules created yet</EmptyTitle>
            </EmptyHeader>
            {canCreate && (
              <EmptyContent>
                <Button onClick={() => navigate('/rules/create')} size="lg">
                  <Plus className="h-5 w-5" />
                  Create Rule
                </Button>
              </EmptyContent>
            )}
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}

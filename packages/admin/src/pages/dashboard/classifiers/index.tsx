import { ClassifierCard } from '@/components/classifier-card';
import { useClient } from '@/hooks/common/use-client';
import { Button } from '@longpoint/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Brain, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Classifiers() {
  const client = useClient();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['classifiers'],
    queryFn: () => client.analysis.listClassifiers(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Classifiers</h2>
            <p className="text-muted-foreground mt-2">
              Automatically categorize and analyze your media
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
            <h2 className="text-3xl font-bold">Classifiers</h2>
            <p className="text-muted-foreground mt-2">
              Automatically categorize and analyze your media
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load classifiers</p>
        </div>
      </div>
    );
  }

  const classifiers = data || [];
  const isEmpty = classifiers.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Classifiers</h2>
          <p className="text-muted-foreground mt-2">
            Automatically categorize and analyze your media
          </p>
        </div>
        <Button onClick={() => navigate('/classifiers/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Classifier
        </Button>
      </div>

      {isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Brain className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">
                No classifiers created yet
              </EmptyTitle>
              <EmptyDescription className="text-base">
                Get started by creating your first classifier
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => navigate('/classifiers/create')} size="lg">
                <Plus className="h-5 w-5" />
                Create
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classifiers.map((classifier) => (
            <ClassifierCard key={classifier.id} classifier={classifier} />
          ))}
        </div>
      )}
    </div>
  );
}

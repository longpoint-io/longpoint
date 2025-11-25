import { DeleteClassifierDialog } from '@/components/delete-classifier-dialog';
import { useClient } from '@/hooks/common/use-client';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, ScanSearchIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function ClassifierDetail() {
  const { classifierId } = useParams<{ classifierId: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: classifier,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['classifier', classifierId],
    queryFn: () => client.analysis.getClassifier(classifierId!),
    enabled: !!classifierId,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !classifier) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => navigate('/classifiers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classifiers
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive">
            Failed to load classifier or classifier not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2">
          <ScanSearchIcon className="h-6 w-6 text-muted-foreground mt-2" />
          <div>
            {' '}
            <h2 className="text-3xl font-bold">{classifier.name}</h2>
            {classifier.description && (
              <p className="text-muted-foreground mt-2">
                {String(classifier.description)}
              </p>
            )}
          </div>
        </div>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provider Information</CardTitle>
            <CardDescription>
              Details about the classification provider used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Provider Name</FieldLabel>
                <p className="text-sm">
                  {String(classifier.provider.displayName)}
                </p>
                {classifier.provider.description && (
                  <FieldDescription>
                    {String(classifier.provider.description)}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel>Provider ID</FieldLabel>
                <p className="text-sm font-mono text-muted-foreground">
                  {String(classifier.provider.id)}
                </p>
              </Field>
              <Field>
                <FieldLabel>Fully Qualified ID</FieldLabel>
                <p className="text-sm font-mono text-muted-foreground">
                  {String(classifier.provider.fullyQualifiedId)}
                </p>
              </Field>
              <Field>
                <FieldLabel>Plugin</FieldLabel>
                <p className="text-sm">
                  {String(classifier.provider.pluginId)}
                </p>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
            <CardDescription>Creation and modification times</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Created</FieldLabel>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(classifier.createdAt).toLocaleString()}
                  </span>
                </div>
              </Field>
              <Field>
                <FieldLabel>Last Updated</FieldLabel>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(classifier.updatedAt).toLocaleString()}
                  </span>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      {Object.keys(classifier.modelInputSchema || {}).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Schema</CardTitle>
            <CardDescription>Available configuration options</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {Object.entries(classifier.modelInputSchema).map(
                ([key, field]) => (
                  <Field key={key}>
                    <FieldLabel>
                      {String(field.label)}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </FieldLabel>
                    <p className="text-sm text-muted-foreground">
                      Type: {String(field.type)}
                    </p>
                    {field.description && (
                      <FieldDescription>
                        {String(field.description)}
                      </FieldDescription>
                    )}
                  </Field>
                )
              )}
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      <DeleteClassifierDialog
        classifierId={classifier.id}
        classifierName={classifier.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}

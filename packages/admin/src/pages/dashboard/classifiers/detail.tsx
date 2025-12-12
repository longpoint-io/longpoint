import { useAuth } from '@/auth';
import { DeleteClassifierDialog } from '@/components/delete-classifier-dialog';
import { useClient } from '@/hooks/common/use-client';
import { Permission } from '@longpoint/types';
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
  const { classifierTemplateId } = useParams<{
    classifierTemplateId: string;
  }>();
  const client = useClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canDelete = hasPermission(Permission.CLASSIFIERS_DELETE);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: classifierTemplate,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['classifier-template', classifierTemplateId],
    queryFn: () =>
      client.classifiers.getClassifierTemplate(classifierTemplateId!),
    enabled: !!classifierTemplateId,
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

  if (error || !classifierTemplate) {
    return (
      <div className="space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/classifier-templates')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classifier Templates
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive">
            Failed to load classifier template or classifier template not found
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
            <h2 className="text-3xl font-bold">{classifierTemplate.name}</h2>
            {classifierTemplate.description && (
              <p className="text-muted-foreground mt-2">
                {String(classifierTemplate.description)}
              </p>
            )}
          </div>
        </div>
        {canDelete && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Classifier Information</CardTitle>
            <CardDescription>Details about the classifier used</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Classifier Name</FieldLabel>
                <p className="text-sm">
                  {String(classifierTemplate.provider.displayName)}
                </p>
                {classifierTemplate.provider.description && (
                  <FieldDescription>
                    {String(classifierTemplate.provider.description)}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel>Classifier ID</FieldLabel>
                <p className="text-sm font-mono text-muted-foreground">
                  {String(classifierTemplate.provider.id)}
                </p>
              </Field>
              <Field>
                <FieldLabel>Fully Qualified ID</FieldLabel>
                <p className="text-sm font-mono text-muted-foreground">
                  {String(classifierTemplate.provider.fullyQualifiedId)}
                </p>
              </Field>
              <Field>
                <FieldLabel>Plugin</FieldLabel>
                <p className="text-sm">
                  {String(classifierTemplate.provider.pluginId)}
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
                    {new Date(classifierTemplate.createdAt).toLocaleString()}
                  </span>
                </div>
              </Field>
              <Field>
                <FieldLabel>Last Updated</FieldLabel>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(classifierTemplate.updatedAt).toLocaleString()}
                  </span>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      {Object.keys(classifierTemplate.modelInputSchema || {}).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Schema</CardTitle>
            <CardDescription>Available configuration options</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {Object.entries(classifierTemplate.modelInputSchema).map(
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
        classifierId={classifierTemplate.id}
        classifierName={classifierTemplate.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}

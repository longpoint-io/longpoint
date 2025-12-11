import { useAuth } from '@/auth';
import { DeleteTransformTemplateDialog } from '@/components/delete-transform-template-dialog';
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
import { Field, FieldGroup, FieldLabel } from '@longpoint/ui/components/field';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Edit, Move3dIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function TransformTemplateDetail() {
  const { templateId } = useParams<{ templateId: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canDelete = hasPermission(Permission.TRANSFORM_TEMPLATES_DELETE);
  const canUpdate = hasPermission(Permission.TRANSFORM_TEMPLATES_UPDATE);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transform-template', templateId],
    queryFn: () => client.transform.getTransformTemplate(templateId!),
    enabled: !!templateId,
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

  if (error || !template) {
    return (
      <div className="space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/transform/templates')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transform Templates
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive">
            Failed to load transform template or template not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2">
          <Move3dIcon className="h-6 w-6 text-muted-foreground mt-2" />
          <div>
            <h2 className="text-3xl font-bold">{template.displayName}</h2>
            {template.description && (
              <p className="text-muted-foreground mt-2">
                {String(template.description)}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {canUpdate && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/transform/templates/${template.id}/edit`)
              }
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>
              Basic details about the transform template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <p className="text-sm font-mono">{template.name}</p>
              </Field>
              <Field>
                <FieldLabel>Display Name</FieldLabel>
                <p className="text-sm">{template.displayName}</p>
              </Field>
              {template.description && (
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <p className="text-sm">{template.description}</p>
                </Field>
              )}
              <Field>
                <FieldLabel>Transformer ID</FieldLabel>
                <p className="text-sm font-mono text-muted-foreground">
                  {template.transformerId}
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
                    {new Date(template.createdAt).toLocaleString()}
                  </span>
                </div>
              </Field>
              <Field>
                <FieldLabel>Last Updated</FieldLabel>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(template.updatedAt).toLocaleString()}
                  </span>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      {template.input && Object.keys(template.input).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Input Configuration</CardTitle>
            <CardDescription>
              Configuration values passed to the transformer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
              {JSON.stringify(template.input, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <DeleteTransformTemplateDialog
        templateId={template.id}
        templateName={template.displayName}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}

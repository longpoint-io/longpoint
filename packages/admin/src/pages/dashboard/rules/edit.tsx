import { useAuth } from '@/auth';
import { DeleteRuleDialog } from '@/components/delete-rule-dialog';
import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Permission } from '@longpoint/types';
import { Button } from '@longpoint/ui/components/button';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Resolver, SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { RuleActionForm } from './rule-action-form';
import { RuleBasicFields } from './rule-basic-fields';
import { RuleConditionBuilder } from './rule-condition-builder';
import { RuleFormData, ruleFormSchema } from './rule-schema';

export function EditRule() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canDelete = hasPermission(Permission.RULES_DELETE);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: rule,
    isLoading: ruleLoading,
    error: ruleError,
  } = useQuery({
    queryKey: ['rule', ruleId],
    queryFn: () => client.rules.get(ruleId!),
    enabled: !!ruleId,
  });

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleFormSchema) as Resolver<RuleFormData>,
    defaultValues: {
      displayName: '',
      enabled: true,
      triggerEvent: 'asset.variant.ready',
      condition: undefined,
      actions: [
        {
          type: 'RUN_CLASSIFIER',
          classifierTemplateId: '',
        },
      ],
    },
  });

  useEffect(() => {
    if (rule) {
      form.reset({
        displayName: rule.displayName,
        enabled: rule.enabled,
        triggerEvent: rule.triggerEvent as 'asset.variant.ready',
        condition: rule.condition || undefined,
        actions: rule.actions,
      });
    }
  }, [rule, form]);

  const updateMutation = useMutation({
    mutationFn: (data: RuleFormData) => client.rules.update(ruleId!, data),
    onSuccess: () => {
      toast.success('Rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.invalidateQueries({ queryKey: ['rule', ruleId] });
    },
    onError: (error) => {
      toast.error('Failed to update rule', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleSubmit: SubmitHandler<RuleFormData> = async (data) => {
    updateMutation.mutate(data);
  };

  if (ruleLoading) {
    return (
      <div className="space-y-8 mb-12">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (ruleError || !rule) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => navigate('/rules')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rules
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive">
            Failed to load rule or rule not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/rules')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold">Edit Rule</h2>
        </div>
        {canDelete && (
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-3xl">
        <div className="grid gap-8">
          {/* Basic information */}
          <RuleBasicFields control={form.control} />
          {/* Conditions */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Conditions</h3>
              <p className="text-sm text-muted-foreground">
                Add conditions for when the rule should run.
              </p>
            </div>
            <RuleConditionBuilder
              control={form.control}
              name="condition"
              triggerEvent={form.watch('triggerEvent')}
            />
          </div>
          {/* Actions */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Actions</h3>
              <p className="text-sm text-muted-foreground">
                The actions to run in parallel when the conditions are met.
              </p>
            </div>
            <RuleActionForm control={form.control} name="actions" />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/rules')}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            isLoading={updateMutation.isPending}
          >
            Update Rule
          </Button>
        </div>
      </form>

      <DeleteRuleDialog
        ruleId={rule.id}
        ruleName={rule.displayName}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}

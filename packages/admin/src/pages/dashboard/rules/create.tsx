import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@longpoint/ui/components/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Resolver, SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RuleActionForm } from './rule-action-form';
import { RuleBasicFields } from './rule-basic-fields';
import { RuleConditionBuilder } from './rule-condition-builder';
import { RuleFormData, ruleFormSchema } from './rule-schema';

export function CreateRule() {
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const createMutation = useMutation({
    mutationFn: (data: RuleFormData) => client.rules.createRule(data),
    onSuccess: (rule) => {
      toast.success('Rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      navigate(`/rules/${rule.id}/edit`);
    },
    onError: (error) => {
      toast.error('Failed to create rule', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleSubmit: SubmitHandler<RuleFormData> = async (data) => {
    createMutation.mutate(data);
  };

  console.log(form.getValues());
  console.log(form.formState.errors);

  return (
    <div className="space-y-8 mb-12">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold">Create Rule</h2>
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
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            isLoading={createMutation.isPending}
          >
            Create Rule
          </Button>
        </div>
      </form>
    </div>
  );
}

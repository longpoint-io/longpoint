import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';

export interface ContributionTemplate<
  InputSchema extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  displayName: string;
  description?: string;
  input: ConfigValues<InputSchema>;
}

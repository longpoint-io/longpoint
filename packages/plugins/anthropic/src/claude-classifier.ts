import Anthropic from '@anthropic-ai/sdk';
import {
  AssetSource,
  Classifier,
  ClassifierArgs,
  ClassifyArgs,
  ClassifyResult,
  LLMFieldCaptureInputValues,
  buildFieldDescriptions,
} from '@longpoint/devkit';
import { AnthropicPluginSettings } from './settings.js';

export class ClaudeClassifier extends Classifier<AnthropicPluginSettings> {
  constructor(args: ClassifierArgs<AnthropicPluginSettings>) {
    super(args);
  }

  async classify(args: ClassifyArgs<LLMFieldCaptureInputValues>) {
    const client = new Anthropic({
      apiKey: this.pluginSettings.apiKey,
    });

    const fieldDescriptions = buildFieldDescriptions(args.classifierInput);
    const schema = this.buildJsonSchema(args.classifierInput);

    const systemPrompt = `
      You are a classifier.
      You will be given an image and a list of fields to capture.
      You will need to capture the fields from the image, based on each field's instructions.
      Some fields will have no particular instructions, in which case use your best judgment to capture the field.
      The fields to capture, along with their instructions, are:
      ${fieldDescriptions.join('\n')}
    `;

    const response = await client.beta.messages.parse({
      model: this.providerId,
      max_tokens: 1024,
      betas: ['structured-outputs-2025-11-13'],
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: this.getSource(args.source),
            },
          ],
        },
      ],
      output_format: {
        type: 'json_schema',
        schema: schema,
      },
    });

    const capturedFields =
      (response.parsed_output as Record<string, unknown> | null) ?? {};

    return this.parseResponse(capturedFields);
  }

  private buildJsonSchema(
    classifierInput: LLMFieldCaptureInputValues
  ): Record<string, unknown> {
    const properties: Record<string, unknown> = {};

    if (classifierInput.assetName?.enabled) {
      properties.assetName = {
        type: 'string',
        description:
          classifierInput.assetName.instructions || 'The name of the asset',
      };
    }

    this.addMetadataFields(
      properties,
      classifierInput.assetMetadata,
      'asset_',
      'Asset metadata field'
    );
    this.addMetadataFields(
      properties,
      classifierInput.variantMetadata,
      'variant_',
      'Variant metadata field'
    );

    return {
      type: 'object',
      properties,
      required: [],
      additionalProperties: false,
    };
  }

  private addMetadataFields(
    properties: Record<string, unknown>,
    fields: Array<{ name: string; instructions?: string }> | undefined,
    prefix: string,
    defaultDescriptionPrefix: string
  ): void {
    if (!fields) return;

    for (const field of fields) {
      properties[`${prefix}${field.name}`] = {
        type: 'string',
        description:
          field.instructions || `${defaultDescriptionPrefix}: ${field.name}`,
      };
    }
  }

  private parseResponse(
    capturedFields: Record<string, unknown>
  ): ClassifyResult {
    const result: ClassifyResult = {};

    if (capturedFields.assetName) {
      result.asset = { name: capturedFields.assetName as string };
    }

    const assetMetadata = this.extractMetadataByPrefix(
      capturedFields,
      'asset_'
    );
    const variantMetadata = this.extractMetadataByPrefix(
      capturedFields,
      'variant_'
    );

    if (Object.keys(assetMetadata).length > 0) {
      result.asset = result.asset || {};
      result.asset.metadata = assetMetadata;
    }

    if (Object.keys(variantMetadata).length > 0) {
      result.variant = { metadata: variantMetadata };
    }

    return result;
  }

  private extractMetadataByPrefix(
    fields: Record<string, unknown>,
    prefix: string
  ): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (key.startsWith(prefix)) {
        metadata[key.slice(prefix.length)] = value;
      }
    }
    return metadata;
  }

  private getSource(source: AssetSource): Anthropic.ImageBlockParam['source'] {
    if (source.base64) {
      return {
        type: 'base64',
        data: source.base64,
        media_type: source.mimeType as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp',
      };
    }

    if (source.url) {
      return { type: 'url', url: source.url };
    }

    throw new Error('Source is required');
  }
}

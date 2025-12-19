import {
  Classifier,
  ClassifierArgs,
  ClassifyArgs,
  ClassifyResult,
  LLMFieldCaptureInputValues,
  buildFieldDescriptions,
} from '@longpoint/devkit/classifier';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod.mjs';
import z from 'zod';
import { OpenAIPluginSettings } from './settings.js';

export class OpenAIClassifier extends Classifier<OpenAIPluginSettings> {
  constructor(args: ClassifierArgs<OpenAIPluginSettings>) {
    super(args);
  }

  async classify(
    args: ClassifyArgs<LLMFieldCaptureInputValues>
  ): Promise<ClassifyResult> {
    const client = new OpenAI({
      apiKey: this.pluginSettings.apiKey,
    });
    const mainTypes = [z.string(), z.number(), z.boolean()];

    // Build schema for all fields to capture
    const schemaFields: Record<string, z.ZodType> = {};

    // Add asset name if enabled
    if (args.classifierInput.assetName?.enabled) {
      schemaFields.assetName = z.string();
    }

    // Add asset metadata fields
    if (args.classifierInput.assetMetadata) {
      for (const field of args.classifierInput.assetMetadata) {
        schemaFields[`asset_${field.name}`] = z.union([
          ...mainTypes,
          z.array(z.union(mainTypes)),
        ]);
      }
    }

    // Add variant metadata fields
    if (args.classifierInput.variantMetadata) {
      for (const field of args.classifierInput.variantMetadata) {
        schemaFields[`variant_${field.name}`] = z.union([
          ...mainTypes,
          z.array(z.union(mainTypes)),
        ]);
      }
    }

    const schema = z.object(schemaFields);

    const fieldDescriptions = buildFieldDescriptions(args.classifierInput);

    const systemPrompt = `
      You are a classifier.
      You will be given an image and a list of fields to capture.
      You will need to capture the fields from the image, based on each field's instructions.
      Some fields will have no particular instructions, in which case use your best judgment to capture the field.
      The fields to capture, along with their instructions, are:
      ${fieldDescriptions.join('\n')}
    `;

    const response = await client.responses.parse({
      model: this.providerId,
      instructions: systemPrompt,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              detail: 'auto',
              image_url: args.source.base64DataUri ?? args.source.url,
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(schema, 'classifier_output'),
      },
    });

    const capturedFields =
      (response.output_parsed as Record<string, unknown>) ?? {};

    // Structure the result according to ClassifyResult format
    const result: ClassifyResult = {};

    // Extract asset name
    if ('assetName' in capturedFields && capturedFields.assetName) {
      result.asset = {
        name: capturedFields.assetName as string,
      };
    }

    // Extract asset metadata
    const assetMetadata: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(capturedFields)) {
      if (key.startsWith('asset_')) {
        const fieldName = key.replace('asset_', '');
        assetMetadata[fieldName] = value;
      }
    }

    if (Object.keys(assetMetadata).length > 0) {
      if (!result.asset) {
        result.asset = {};
      }
      result.asset.metadata = assetMetadata;
    }

    // Extract variant metadata
    const variantMetadata: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(capturedFields)) {
      if (key.startsWith('variant_')) {
        const fieldName = key.replace('variant_', '');
        variantMetadata[fieldName] = value;
      }
    }

    if (Object.keys(variantMetadata).length > 0) {
      result.variant = {
        metadata: variantMetadata,
      };
    }

    return result;
  }
}

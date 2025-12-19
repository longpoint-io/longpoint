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

    const systemPrompt = `
      You are a classifier.
      You will be given an image and a list of fields to capture.
      You will need to capture the fields from the image, based on each field's instructions.
      Some fields will have no particular instructions, in which case use your best judgment to capture the field.
      You will need to return the fields as a raw JSON string with no formatting.
      DO NOT wrap the JSON in a code block like \`\`\`json {} \`\`\`.
      The fields to capture, along with their instructions, are:
      ${fieldDescriptions.join('\n')}
    `;

    const maxRetries = this.pluginSettings.classifierRetries ?? 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await client.messages.create({
          model: this.providerId,
          max_tokens: 1024,
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
        });

        const fullOutput = result.content.reduce((acc, curr) => {
          if (curr.type === 'text') {
            acc += curr.text;
          }
          return acc;
        }, '');

        const capturedFields = JSON.parse(fullOutput) as Record<
          string,
          unknown
        >;

        const classifyResult: ClassifyResult = {};

        if ('assetName' in capturedFields && capturedFields.assetName) {
          classifyResult.asset = {
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
          if (!classifyResult.asset) {
            classifyResult.asset = {};
          }
          classifyResult.asset.metadata = assetMetadata;
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
          classifyResult.variant = {
            metadata: variantMetadata,
          };
        }

        return classifyResult;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === maxRetries - 1) {
          throw new Error(
            `Failed to classify after ${maxRetries} attempts. Last error: ${lastError.message}`
          );
        }
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Failed to classify');
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

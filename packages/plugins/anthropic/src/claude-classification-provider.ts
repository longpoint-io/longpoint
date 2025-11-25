import Anthropic from '@anthropic-ai/sdk';
import {
  AssetSource,
  ClassificationProvider,
  ClassificationProviderArgs,
  ClassifyArgs,
  LLMFieldCaptureInputValues,
} from '@longpoint/devkit';
import { AnthropicPluginSettings } from './settings.js';

export class ClaudeClassificationProvider extends ClassificationProvider<AnthropicPluginSettings> {
  constructor(args: ClassificationProviderArgs<AnthropicPluginSettings>) {
    super(args);
  }

  async classify(args: ClassifyArgs<LLMFieldCaptureInputValues>) {
    const client = new Anthropic({
      apiKey: this.pluginSettings.apiKey,
    });
    const systemPrompt = `
      You are a classifier.
      You will be given an image and a list of fields to capture.
      You will need to capture the fields from the image, based on each field's instructions.
      Some fields will have no particular instructions, in which case use your best judgment to capture the field.
      You will need to return the fields as a raw JSON string with no formatting.
      DO NOT wrap the JSON in a code block like \`\`\`json {} \`\`\`.
      e.g. For the field "type", with instructions "Choose the type of fruit", the response might be: {"type": "apple"}
      The fields to capture, along with their instructions, are:
      ${args.classifierInput.fieldCapture
        .map(
          (field) =>
            `- ${field.name}${
              field.instructions ? `: ${field.instructions}` : ''
            }`
        )
        .join('\n')}
    `;

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

    return JSON.parse(fullOutput);
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

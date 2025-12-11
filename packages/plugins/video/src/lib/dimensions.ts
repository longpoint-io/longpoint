import { ConfigSchemaValue } from '@longpoint/config-schema';

const dimensionsInputSchema = {
  label: 'Dimensions',
  type: 'object',
  properties: {
    width: {
      label: 'Width',
      type: 'number',
      description: 'Output width in pixels',
      placeholder: '1920',
    },
    height: {
      label: 'Height',
      type: 'number',
      description: 'Output height in pixels',
      placeholder: '1080',
    },
    maintainAspectRatio: {
      label: 'Maintain aspect ratio',
      type: 'boolean',
      description: 'Preserve original aspect ratio when resizing',
    },
  },
} satisfies ConfigSchemaValue;

export default dimensionsInputSchema;

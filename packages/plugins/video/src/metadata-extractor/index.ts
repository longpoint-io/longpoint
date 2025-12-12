import { ClassifierContribution, LongpointMimeType } from '@longpoint/devkit';
import MetadataExtractor from './metadata-extractor.js';

const metadataExtractorContribution = {
  classifier: MetadataExtractor,
  displayName: 'Metadata Extractor',
  description: 'Extract key metadata from multimedia files.',
  supportedMimeTypes: [
    LongpointMimeType.MP4,
    LongpointMimeType.MOV,
    LongpointMimeType.WEBM,
    LongpointMimeType.JPG,
    LongpointMimeType.JPEG,
    LongpointMimeType.PNG,
    LongpointMimeType.GIF,
    LongpointMimeType.WEBP,
  ],
} satisfies ClassifierContribution;

export default metadataExtractorContribution;

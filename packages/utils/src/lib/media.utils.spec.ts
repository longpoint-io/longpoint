import { mimeTypeToAssetType } from './media.utils';

describe('media.utils', () => {
  it('should convert a video mime type to video type', () => {
    expect(mimeTypeToAssetType('video/mp4')).toEqual('VIDEO');
    expect(mimeTypeToAssetType('video/webm')).toEqual('VIDEO');
    expect(mimeTypeToAssetType('video/quicktime')).toEqual('VIDEO');
  });

  it('should convert a image mime type to image type', () => {
    expect(mimeTypeToAssetType('image/jpeg')).toEqual('IMAGE');
  });

  it('should throw an error for an unsupported mime type', () => {
    expect(() => mimeTypeToAssetType('application/pdf')).toThrow(
      'Unsupported media type: application/pdf'
    );
  });
});

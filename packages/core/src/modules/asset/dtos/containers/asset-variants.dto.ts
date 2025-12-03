import { AssetVariantType } from '@/database';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { type SelectedAsset } from '../../asset.selectors';
import { AssetVariantDto } from './asset-variant.dto';

export type AssetVariantsParams = SelectedAsset['variants'];

@ApiSchema({ name: 'AssetVariants' })
export class AssetVariantsDto {
  @ApiProperty({
    description: 'The primary asset variant',
    type: AssetVariantDto,
  })
  primary: AssetVariantDto;

  constructor(data: AssetVariantsParams) {
    this.primary = this.getPrimaryVariant(data);
  }

  private getPrimaryVariant(data: AssetVariantsParams) {
    const primary = data.find(
      (variant) => variant.variant === AssetVariantType.PRIMARY
    );
    if (!primary) {
      throw new Error('Expected primary variant - not found');
    }
    return new AssetVariantDto(primary);
  }
}

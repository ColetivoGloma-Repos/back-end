import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { DonationCollectionType } from '../../shared';
import { CommonMessagesHelper } from 'src/common/helpers';

export class UpdateDonationCollectionTypeDto {
  @ApiProperty({
    enum: DonationCollectionType,
    description: 'Tipo de coleta: o doador entrega (DELIVERY) ou precisa de coleta (PICKUP)',
  })
  @IsNotEmpty({ message: CommonMessagesHelper.FIELD_IS_REQUIRED('collectionType') })
  @IsEnum(DonationCollectionType, {
    message: CommonMessagesHelper.FIELD_INVALID_TYPE('collectionType', 'enum'),
  })
  collectionType!: DonationCollectionType;
}

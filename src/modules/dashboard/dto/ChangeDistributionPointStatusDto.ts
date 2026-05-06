import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { DistributionPointStatus } from "src/modules/distribution-points/shared/enums";

export class ChangeDistributionPointStatusDto {
    @ApiProperty({
        enum: DistributionPointStatus,
        enumName: 'DistributionPointStatus',
        required: true,
    })
    @IsEnum(DistributionPointStatus)
    status: DistributionPointStatus;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    id: string;
}

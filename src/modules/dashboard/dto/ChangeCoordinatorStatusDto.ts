import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { Status } from "src/modules/auth/enums/auth";

export class ChangeCoordinatorStatusDto {
    @ApiProperty({
    enum: Status,
    enumName: 'Status',
    required: true,
    })
    @ValidateIf((o) => o.type !== '')
    @IsEnum(Status)
    status: Status

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    id: string
}
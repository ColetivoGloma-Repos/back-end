import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { StatusDistributionPoint } from "../enums/distribuition-point.enum";

export class ChangeStatusDto {
  @ApiProperty()
  @IsEnum(StatusDistributionPoint)
  status: StatusDistributionPoint;
}
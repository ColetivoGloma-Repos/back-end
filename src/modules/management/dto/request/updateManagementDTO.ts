import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";
import { UpdateAddressDto } from "./updateAddressDto";


export class UpdateManagementDTO{


  @ApiProperty({ type: String, format: 'date-time', example: '2024-06-17T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  collectionDate: Date;

 
  @ApiProperty()
  @IsOptional()
  collectPoint: UpdateAddressDto;
  
}
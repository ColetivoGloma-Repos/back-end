import { IsEnum, IsOptional, IsString, ValidateIf } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { QueryRequest } from "src/common/dto/query";
import { Status } from "src/modules/auth/enums/auth";

export class RequestCoordinator extends QueryRequest {

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    search: string; 

}

export class RequestAdminInitiative extends QueryRequest {

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    search: string; 

}
import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { query } from "express";
import { RequestCoordinator } from "./dto/RequestCoordinators";
import { AdminService } from "./admin.service";
import { ChangeCoordinatorStatusDto } from "./dto/ChangeCoordinatorStatusDto";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags('admin')
@Controller('/admin')
export class AdminController {
    constructor(
        private userAdmin: AdminService
    ){}

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard) 
    @Roles('admin')
    @Get('/coordinators')        
    async acceptCoordinator(@Query() query: RequestCoordinator) {
        return this.userAdmin.findAllCoordinator(query)        
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard) 
    @Roles('coordinator')
    @Patch('/coordinators')
    async changeCoordinatorStatus(@Body() dto: ChangeCoordinatorStatusDto) {
        const status = await this.userAdmin.changeCoordinatorStatus(dto)
        return { message:  `O coordenador foi alterado para o status: ${status}`}
    }

}
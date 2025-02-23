import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { query } from "express";
import { RequestCoordinator } from "./dto/RequestCoordinators";
import { UserDashboardService } from "./user-dashboard.service";
import { ChangeCoordinatorStatusDto } from "./dto/ChangeCoordinatorStatusDto";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags('user-dashboard')
@Controller('/user-dashboard')
export class UseDashboardController {
    constructor(
        private userDashboardService: UserDashboardService
    ){}

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard) 
    @Roles('coordinator')
    @Get('/coordinators')        
    async acceptCoordinator(@Query() query: RequestCoordinator) {
        return this.userDashboardService.findAllCoordinator(query)        
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard) 
    @Roles('coordinator')
    @Patch('/coordinators')
    async changeCoordinatorStatus(@Body() dto: ChangeCoordinatorStatusDto) {
        const status = await this.userDashboardService.changeCoordinatorStatus(dto)
        return { message:  `O coordenador foi alterado para o status: ${status}`}
    }

}
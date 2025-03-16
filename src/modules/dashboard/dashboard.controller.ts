import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { query } from "express";
import { RequestCoordinator } from "./dto/RequestCoordinators";
import { DashboardService } from "./dashboard.service";
import { ChangeCoordinatorStatusDto } from "./dto/ChangeCoordinatorStatusDto";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags('Dashboard')
@Controller('/dashboard')
export class DashboardController {
    constructor(
        private dashboardService: DashboardService
    ){}

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard) 
    @Roles('admin')
    @Get('/coordinators')        
    async acceptCoordinator(@Query() query: RequestCoordinator) {
        return this.dashboardService.findAllCoordinator(query)        
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard) 
    @Roles('admin')
    @Patch('/coordinators')
    async changeCoordinatorStatus(@Body() dto: ChangeCoordinatorStatusDto) {
        const status = await this.dashboardService.changeCoordinatorStatus(dto)
        return { message:  `O coordenador foi alterado para o status: ${status}`}
    }

}
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/entities/auth.enity";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { ShelterModule } from "../shelter/shelter.module";
import { DistributionPoint } from "../distribution-points/entities/distribution-point.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User, DistributionPoint]), ShelterModule],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [],
})


export class DashboardModule {}

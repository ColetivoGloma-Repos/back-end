import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/entities/auth.enity";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { ShelterModule } from "../shelter/shelter.module";

@Module({
    imports: [TypeOrmModule.forFeature([User]), ShelterModule],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [],
})


export class DashboardModule {}

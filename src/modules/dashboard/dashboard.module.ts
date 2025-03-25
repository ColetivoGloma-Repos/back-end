import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/entities/auth.enity";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [],
})


export class DashboardModule {}

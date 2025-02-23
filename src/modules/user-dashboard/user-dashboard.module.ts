import { Module } from "@nestjs/common";
import { UseDashboardController } from "./user-dashboard.controller";
import { UserDashboardService } from "./user-dashboard.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/entities/auth.enity";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UseDashboardController],
    providers: [UserDashboardService],
    exports: [],
})


export class UserDashboard {}
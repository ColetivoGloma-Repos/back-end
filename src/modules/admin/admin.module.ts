import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/entities/auth.enity";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [],
})


export class AdminModule {}
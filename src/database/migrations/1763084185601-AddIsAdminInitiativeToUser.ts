import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsAdminInitiativeToUser1763084185601 implements MigrationInterface {
    name = 'AddIsAdminInitiativeToUser1763084185601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "isAdminInitiative" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."user_roles_enum" RENAME TO "user_roles_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_roles_enum" AS ENUM('user', 'coordinator', 'admin', 'initiative-administrator')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" TYPE "public"."user_roles_enum"[] USING "roles"::"text"::"public"."user_roles_enum"[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT '{user}'`);
        await queryRunner.query(`DROP TYPE "public"."user_roles_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_roles_enum_old" AS ENUM('user', 'coordinator', 'admin')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" TYPE "public"."user_roles_enum_old"[] USING "roles"::"text"::"public"."user_roles_enum_old"[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT '{user}'`);
        await queryRunner.query(`DROP TYPE "public"."user_roles_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_roles_enum_old" RENAME TO "user_roles_enum"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isAdminInitiative"`);
    }

}

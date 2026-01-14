import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTableUser1760000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'initiative-administrator'
        ) THEN
          ALTER TYPE "user_roles_enum"
          ADD VALUE 'initiative-administrator';
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "isAdminInitiative" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "isAdminInitiative";
    `);
  }
}

import { NotImplementedException } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part4ResetSequences1724836165357 implements MigrationInterface {
  name = "V13Part4ResetSequences1724836165357";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DO $$
        DECLARE
            rec RECORD;
        BEGIN
            FOR rec IN 
                SELECT 
                    tablename, 
                    column_default
                FROM 
                    pg_tables t
                JOIN 
                    information_schema.columns c 
                ON 
                    t.tablename = c.table_name 
                WHERE 
                    schemaname = 'public' 
                    AND column_default LIKE 'nextval(%::regclass)' 
                    AND c.column_name = 'id'
            LOOP
                EXECUTE format('SELECT setval(pg_get_serial_sequence(''%I'', ''id''), COALESCE(MAX(id), 1)) FROM %I;', rec.tablename, rec.tablename);
            END LOOP;
        END $$;
    `);
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}

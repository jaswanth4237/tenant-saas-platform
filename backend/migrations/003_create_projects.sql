DO $$ BEGIN
    CREATE TYPE "enum_projects_status" AS ENUM ('active', 'archived', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "projects" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "enum_projects_status" DEFAULT 'active',
    "tenant_id" UUID NOT NULL REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "created_by" UUID NOT NULL REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
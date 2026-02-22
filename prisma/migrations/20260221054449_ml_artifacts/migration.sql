-- AlterTable
ALTER TABLE "public"."Fragment" ADD COLUMN     "apiPath" TEXT,
ADD COLUMN     "appPath" TEXT,
ADD COLUMN     "dataPath" TEXT,
ADD COLUMN     "metrics" JSONB,
ADD COLUMN     "modelPath" TEXT,
ADD COLUMN     "phase" TEXT NOT NULL DEFAULT 'done',
ADD COLUMN     "plots" JSONB,
ADD COLUMN     "reportPath" TEXT,
ALTER COLUMN "sandboxUrl" SET DEFAULT '';

-- CreateTable
CREATE TABLE "public"."Usage" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "expire" TIMESTAMP(3),

    CONSTRAINT "Usage_pkey" PRIMARY KEY ("key")
);

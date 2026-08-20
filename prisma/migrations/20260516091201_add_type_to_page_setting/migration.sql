-- CreateEnum
CREATE TYPE "PageSettingType" AS ENUM ('TEXT', 'NUMBER', 'ARRAY', 'IMAGE');

-- AlterTable
ALTER TABLE "pageSetting" ADD COLUMN     "type" "PageSettingType" NOT NULL DEFAULT 'TEXT';

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "table_sessions" ADD COLUMN "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "table_sessions" ADD COLUMN "closed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "cancelled_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "called_at" TIMESTAMP(3);

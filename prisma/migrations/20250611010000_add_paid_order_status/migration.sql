-- Add PAID between ready and completed in the application workflow.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PAID';

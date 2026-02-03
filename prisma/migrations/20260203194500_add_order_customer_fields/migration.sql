-- Add customer address fields to Order
ALTER TABLE "Order" ADD COLUMN "customer_email" TEXT;
ALTER TABLE "Order" ADD COLUMN "customer_address" TEXT;
ALTER TABLE "Order" ADD COLUMN "customer_city" TEXT;
ALTER TABLE "Order" ADD COLUMN "customer_province" TEXT;
ALTER TABLE "Order" ADD COLUMN "customer_postal_code" TEXT;

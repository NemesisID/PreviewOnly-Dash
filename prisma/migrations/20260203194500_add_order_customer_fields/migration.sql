-- Add customer address fields to Order
ALTER TABLE `Order` ADD COLUMN `customer_email` VARCHAR(255) NULL;
ALTER TABLE `Order` ADD COLUMN `customer_address` TEXT NULL;
ALTER TABLE `Order` ADD COLUMN `customer_city` VARCHAR(255) NULL;
ALTER TABLE `Order` ADD COLUMN `customer_province` VARCHAR(255) NULL;
ALTER TABLE `Order` ADD COLUMN `customer_postal_code` VARCHAR(50) NULL;

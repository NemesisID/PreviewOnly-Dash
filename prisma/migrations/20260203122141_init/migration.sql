-- CreateTable
CREATE TABLE `Product` (
    `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `price` INT NOT NULL,
    `image_path` VARCHAR(1024) NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CreateTable
CREATE TABLE `Outlet` (
    `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `address` TEXT NOT NULL,
    `google_maps_link` TEXT NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `image_path` VARCHAR(1024) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CreateTable
CREATE TABLE `Order` (
    `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(255) NOT NULL,
    `tracking_code` VARCHAR(255) NOT NULL,
    `receipt_number` VARCHAR(255) NOT NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_phone` VARCHAR(50) NOT NULL,
    `total_price` INT NOT NULL,
    `status` ENUM('pending','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
    `source` ENUM('web','shopee','tiktok') NOT NULL DEFAULT 'web',
    `shipping_courier` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `orderId` INT NOT NULL,
    `productId` INT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `price` INT NOT NULL,
    CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('WAITING', 'ON_GOING', 'FINISHED') NOT NULL DEFAULT 'WAITING',
    `currentPlayerId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User_Match` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_Match_userId_matchId_key`(`userId`, `matchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Score` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `victories` INTEGER NOT NULL DEFAULT 0,
    `draw` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `endpointAccess` VARCHAR(191) NOT NULL,
    `requestMethod` VARCHAR(191) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `responseTime` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,

    INDEX `ApiLog_endpointAccess_idx`(`endpointAccess`),
    INDEX `ApiLog_requestMethod_idx`(`requestMethod`),
    INDEX `ApiLog_statusCode_idx`(`statusCode`),
    INDEX `ApiLog_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User_Match` ADD CONSTRAINT `User_Match_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_Match` ADD CONSTRAINT `User_Match_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Score` ADD CONSTRAINT `Score_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApiLog` ADD CONSTRAINT `ApiLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS `user` (
    `user_id` VARCHAR(64) NOT NULL,
    `email` VARCHAR(255) NULL,
    `nickname` VARCHAR(100) NOT NULL,
    `provider` VARCHAR(50) NOT NULL DEFAULT 'demo',
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `map` (
    `position_id` INT NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(100) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `district` VARCHAR(50) NOT NULL,
    `category` VARCHAR(20) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `summary` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `vibe_tags` JSON NOT NULL,
    `visit_time` VARCHAR(50) NOT NULL,
    `route_hint` VARCHAR(255) NOT NULL,
    `stamp_reward` VARCHAR(120) NOT NULL,
    `hero_label` VARCHAR(60) NOT NULL,
    `jam_color` VARCHAR(20) NOT NULL,
    `accent_color` VARCHAR(20) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    PRIMARY KEY (`position_id`),
    UNIQUE KEY `uq_map_slug` (`slug`),
    KEY `idx_map_category` (`category`),
    KEY `idx_map_active_name` (`is_active`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `feed` (
    `feed_id` INT NOT NULL AUTO_INCREMENT,
    `position_id` INT NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `body` TEXT NOT NULL,
    `mood` VARCHAR(20) NOT NULL,
    `badge` VARCHAR(50) NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    PRIMARY KEY (`feed_id`),
    KEY `idx_feed_position_id` (`position_id`),
    KEY `idx_feed_user_id` (`user_id`),
    CONSTRAINT `fk_feed_position_id` FOREIGN KEY (`position_id`) REFERENCES `map` (`position_id`),
    CONSTRAINT `fk_feed_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_comment` (
    `comment_id` INT NOT NULL AUTO_INCREMENT,
    `feed_id` INT NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `parent_id` INT NULL,
    `body` TEXT NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    PRIMARY KEY (`comment_id`),
    KEY `idx_user_comment_feed_id` (`feed_id`),
    KEY `idx_user_comment_user_id` (`user_id`),
    KEY `idx_user_comment_parent_id` (`parent_id`),
    CONSTRAINT `fk_user_comment_feed_id` FOREIGN KEY (`feed_id`) REFERENCES `feed` (`feed_id`),
    CONSTRAINT `fk_user_comment_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
    CONSTRAINT `fk_user_comment_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `user_comment` (`comment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course` (
    `course_id` INT NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `mood` VARCHAR(20) NOT NULL,
    `duration` VARCHAR(40) NOT NULL,
    `note` VARCHAR(255) NOT NULL,
    `color` VARCHAR(20) NOT NULL,
    `display_order` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`course_id`),
    UNIQUE KEY `uq_course_slug` (`slug`),
    KEY `idx_course_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_place` (
    `course_place_id` INT NOT NULL AUTO_INCREMENT,
    `course_id` INT NOT NULL,
    `position_id` INT NOT NULL,
    `stop_order` INT NOT NULL,
    PRIMARY KEY (`course_place_id`),
    UNIQUE KEY `uq_course_place` (`course_id`, `position_id`),
    KEY `idx_course_place_stop_order` (`course_id`, `stop_order`),
    CONSTRAINT `fk_course_place_course_id` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`),
    CONSTRAINT `fk_course_place_position_id` FOREIGN KEY (`position_id`) REFERENCES `map` (`position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_stamp` (
    `stamp_id` INT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(64) NOT NULL,
    `position_id` INT NOT NULL,
    `created_at` DATETIME NOT NULL,
    PRIMARY KEY (`stamp_id`),
    UNIQUE KEY `uq_user_stamp` (`user_id`, `position_id`),
    KEY `idx_user_stamp_position_id` (`position_id`),
    CONSTRAINT `fk_user_stamp_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
    CONSTRAINT `fk_user_stamp_position_id` FOREIGN KEY (`position_id`) REFERENCES `map` (`position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
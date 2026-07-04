-- ============================================================
-- MoodTravel 数据库建表脚本
-- 数据库：MySQL 8.0+ / 编码：utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS moodtravel
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE moodtravel;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE `user` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `openid`        VARCHAR(64)     NOT NULL UNIQUE COMMENT '微信 openid',
  `unionid`       VARCHAR(64)     DEFAULT NULL COMMENT '微信 unionid',
  `nickname`      VARCHAR(50)     NOT NULL DEFAULT '',
  `avatar_url`    VARCHAR(255)    NOT NULL DEFAULT '',
  `gender`        TINYINT         DEFAULT 0 COMMENT '0未知 1男 2女',
  `birth_year`    SMALLINT        DEFAULT NULL,
  `home_city`     VARCHAR(50)     DEFAULT '' COMMENT '常驻城市',
  `phone`         VARCHAR(20)     DEFAULT NULL,
  `status`        TINYINT         DEFAULT 1 COMMENT '0禁用 1正常',
  `created_at`    DATETIME        DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_city` (`home_city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';


-- ============================================================
-- 2. 用户偏好表
-- ============================================================
CREATE TABLE `user_preference` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id`               BIGINT UNSIGNED NOT NULL UNIQUE,
  `default_budget_min`    INT    DEFAULT 500,
  `default_budget_max`    INT    DEFAULT 5000,
  `default_companion_count` TINYINT DEFAULT 1,
  `dietary_tags`          JSON   DEFAULT NULL COMMENT '["lowFat","halal","vegetarian"]',
  `dietary_goals`         JSON   DEFAULT NULL COMMENT '["weight_loss","muscle_gain"]',
  `travel_pace`           ENUM('slow','moderate','fast') DEFAULT 'moderate',
  `interests`             JSON   DEFAULT NULL COMMENT '["nature","history","food"]',
  `avoidances`            JSON   DEFAULT NULL COMMENT '["crowded","extreme_sports"]',
  `daily_activity_hours`  TINYINT DEFAULT 6,
  `created_at`            DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户偏好表';


-- ============================================================
-- 3. 心情记录表
-- ============================================================
CREATE TABLE `mood_log` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id`         BIGINT UNSIGNED NOT NULL,
  `mood_label`      ENUM('excited','happy','calm','anxious','tired','sad') NOT NULL,
  `mood_index`      TINYINT UNSIGNED NOT NULL COMMENT '1-10',
  `triggers`        JSON DEFAULT NULL COMMENT '["work_stress","lack_of_sleep"]',
  `desired_outcome` ENUM('relaxation','adventure','healing','social') DEFAULT 'relaxation',
  `recorded_at`     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_mood` (`user_id`, `recorded_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='心情记录表';


-- ============================================================
-- 4. 行程主表
-- ============================================================
CREATE TABLE `trip` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id`           BIGINT UNSIGNED NOT NULL,
  `destination`       VARCHAR(50) NOT NULL COMMENT '目的地城市',
  `city_code`         VARCHAR(10) DEFAULT NULL COMMENT '高德城市编码',
  `start_date`        DATE NOT NULL,
  `end_date`          DATE NOT NULL,
  `total_budget`      DECIMAL(10,2) DEFAULT NULL,
  `actual_cost`       DECIMAL(10,2) DEFAULT 0,

  -- 感性变量
  `mood_label`        ENUM('excited','happy','calm','anxious','tired','sad') NOT NULL,
  `mood_index`        TINYINT UNSIGNED DEFAULT NULL,

  -- 现实约束
  `companion_count`   TINYINT DEFAULT 1,
  `companion_types`   JSON DEFAULT NULL COMMENT '[{"role":"child","age":5}]',
  `has_kids`          TINYINT(1) DEFAULT 0,
  `has_elderly`       TINYINT(1) DEFAULT 0,
  `is_dieting`        TINYINT(1) DEFAULT 0,
  `dietary_tags`      JSON DEFAULT NULL,
  `budget_sensitive`  TINYINT(1) DEFAULT 0,
  `budget_label`      ENUM('economy','comfort','quality','luxury') DEFAULT 'comfort',

  -- 天气快照
  `weather_snapshot`  JSON DEFAULT NULL,

  `status`            ENUM('draft','active','completed','cancelled') DEFAULT 'draft',
  `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_status` (`user_id`, `status`),
  INDEX `idx_destination` (`destination`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行程主表';


-- ============================================================
-- 5. 行程明细表
-- ============================================================
CREATE TABLE `trip_item` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `trip_id`           BIGINT UNSIGNED NOT NULL,
  `day_number`        TINYINT NOT NULL,
  `time_slot`         TIME NOT NULL,
  `end_time_slot`     TIME DEFAULT NULL,
  `order_index`       TINYINT NOT NULL,

  `item_type`         ENUM('poi','hotel','restaurant','transport','rest') NOT NULL,
  `poi_id`            BIGINT UNSIGNED DEFAULT NULL,
  `hotel_id`          BIGINT UNSIGNED DEFAULT NULL,
  `restaurant_id`     BIGINT UNSIGNED DEFAULT NULL,

  `name`              VARCHAR(100) DEFAULT NULL,
  `desc`              VARCHAR(255) DEFAULT NULL,
  `category`          VARCHAR(30) DEFAULT NULL,

  -- 推荐理由
  `recommend_reason`  VARCHAR(255) DEFAULT NULL,
  `reason_tags`       JSON DEFAULT NULL,
  `match_score`       DECIMAL(4,2) DEFAULT NULL,

  -- 价格
  `estimated_cost`    DECIMAL(8,2) DEFAULT 0,
  `actual_cost`       DECIMAL(8,2) DEFAULT NULL,
  `saved_amount`      DECIMAL(8,2) DEFAULT 0,

  -- 状态
  `weather_override`  TINYINT(1) DEFAULT 0,
  `original_poi_id`   BIGINT UNSIGNED DEFAULT NULL,
  `is_completed`      TINYINT(1) DEFAULT 0,
  `user_note`         VARCHAR(255) DEFAULT NULL,

  FOREIGN KEY (`trip_id`) REFERENCES `trip`(`id`) ON DELETE CASCADE,
  INDEX `idx_trip_day` (`trip_id`, `day_number`, `order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行程明细表';


-- ============================================================
-- 6. POI 景点表（核心）
-- ============================================================
CREATE TABLE `poi` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name`                VARCHAR(100) NOT NULL,
  `city`                VARCHAR(50) NOT NULL,
  `district`            VARCHAR(50) DEFAULT NULL,
  `category`            ENUM('scenic','museum','park','temple','theme_park',
                             'shopping','sport','entertainment','leisure','other') NOT NULL,
  `sub_category`        VARCHAR(50) DEFAULT NULL,

  -- 地理
  `latitude`            DECIMAL(10,7) NOT NULL,
  `longitude`           DECIMAL(10,7) NOT NULL,
  `address`             VARCHAR(255) DEFAULT NULL,
  `amap_poi_id`         VARCHAR(50) DEFAULT NULL,

  -- 多维标签（核心）
  `mood_scores`         JSON NOT NULL COMMENT '{"happy":7.5,"calm":9.0,"tired":8.5,"anxious":9.0,"sad":8.0,"excited":4.0}',
  `energy_level`        TINYINT NOT NULL COMMENT '体力消耗 1-5',
  `crowdedness_level`   TINYINT DEFAULT 3 COMMENT '拥挤程度 1-5',
  `weather_sensitivity` ENUM('indoor','outdoor','mixed','all-weather') DEFAULT 'outdoor',

  -- 亲子/老人
  `kids_friendly`       TINYINT(1) DEFAULT 0,
  `min_age`             TINYINT DEFAULT NULL,
  `stroller_ok`         TINYINT(1) DEFAULT 0,
  `nursing_room`        TINYINT(1) DEFAULT 0,
  `elderly_friendly`    TINYINT(1) DEFAULT 0,
  `wheelchair_ok`       TINYINT(1) DEFAULT 0,
  `rest_areas`          TINYINT DEFAULT 0,

  -- 性价比
  `ticket_price`        DECIMAL(8,2) DEFAULT 0,
  `price_tier`          ENUM('free','budget','value','premium','luxury') DEFAULT 'budget',
  `discount_info`       VARCHAR(255) DEFAULT NULL,
  `free_days`           JSON DEFAULT NULL COMMENT '["monday","tuesday"]',

  -- 运营
  `opening_hours`       VARCHAR(100) DEFAULT '09:00-17:00',
  `closed_days`         JSON DEFAULT NULL,
  `estimated_duration`  INT DEFAULT 90 COMMENT '分钟',
  `walking_distance`    INT DEFAULT NULL COMMENT '内部步行距离(米)',

  -- 评分
  `rating`              DECIMAL(2,1) DEFAULT 0,
  `review_count`        INT DEFAULT 0,

  -- 标签
  `tags`                JSON DEFAULT NULL COMMENT '["拍照好看","文化深度","网红打卡"]',
  `suitable_scenes`     JSON DEFAULT NULL COMMENT '["solo","couple","family"]',
  `cover_image`         VARCHAR(255) DEFAULT NULL,

  `status`              TINYINT DEFAULT 1,
  `created_at`          DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_city_category` (`city`, `category`),
  INDEX `idx_energy` (`energy_level`),
  INDEX `idx_weather` (`weather_sensitivity`),
  INDEX `idx_price` (`price_tier`),
  INDEX `idx_kids` (`kids_friendly`),
  INDEX `idx_rating` (`rating` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='POI景点数据库';


-- ============================================================
-- 7. 酒店表
-- ============================================================
CREATE TABLE `hotel` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name`              VARCHAR(100) NOT NULL,
  `city`              VARCHAR(50) NOT NULL,
  `district`          VARCHAR(50) DEFAULT NULL,
  `latitude`          DECIMAL(10,7) DEFAULT NULL,
  `longitude`         DECIMAL(10,7) DEFAULT NULL,
  `address`           VARCHAR(255) DEFAULT NULL,

  -- 价格
  `price_range_low`   DECIMAL(8,2) DEFAULT NULL,
  `price_range_high`  DECIMAL(8,2) DEFAULT NULL,
  `price_tier`        ENUM('budget','value','premium','luxury') DEFAULT 'value',
  `platform_prices`   JSON DEFAULT NULL COMMENT '[{"platform":"ctrip","price":388},{"platform":"meituan","price":358}]',
  `best_price`        DECIMAL(8,2) DEFAULT NULL,
  `best_platform`     VARCHAR(20) DEFAULT NULL,

  -- 心情
  `mood_scores`       JSON DEFAULT NULL COMMENT '{"tired":9.0,"calm":8.0,"happy":7.0}',

  -- 设施
  `stars`             TINYINT DEFAULT 3,
  `has_spa`           TINYINT(1) DEFAULT 0,
  `has_gym`           TINYINT(1) DEFAULT 0,
  `has_pool`          TINYINT(1) DEFAULT 0,
  `has_restaurant`    TINYINT(1) DEFAULT 0,

  -- 亲子/老人
  `kids_friendly`     TINYINT(1) DEFAULT 0,
  `elderly_friendly`  TINYINT(1) DEFAULT 0,

  -- 饮食
  `breakfast_included` TINYINT(1) DEFAULT 0,
  `dietary_options`   JSON DEFAULT NULL,

  `rating`            DECIMAL(2,1) DEFAULT 0,
  `review_count`      INT DEFAULT 0,
  `status`            TINYINT DEFAULT 1,
  `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_city_price` (`city`, `price_tier`),
  INDEX `idx_rating` (`rating` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='酒店表';


-- ============================================================
-- 8. 餐厅表
-- ============================================================
CREATE TABLE `restaurant` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name`                VARCHAR(100) NOT NULL,
  `city`                VARCHAR(50) NOT NULL,
  `district`            VARCHAR(50) DEFAULT NULL,
  `latitude`            DECIMAL(10,7) DEFAULT NULL,
  `longitude`           DECIMAL(10,7) DEFAULT NULL,
  `address`             VARCHAR(255) DEFAULT NULL,
  `amap_poi_id`         VARCHAR(50) DEFAULT NULL,

  `cuisine`             VARCHAR(50) DEFAULT NULL COMMENT '杭帮菜/日料/轻食/火锅',
  `avg_cost`            DECIMAL(8,2) DEFAULT NULL,

  -- 饮食标签
  `dietary_tags`        JSON DEFAULT NULL COMMENT '["lowFat","vegetarian","halal","highProtein"]',
  `avg_calories`        INT DEFAULT NULL COMMENT '推荐菜品平均热量(大卡)',
  `is_diet_friendly`    TINYINT(1) DEFAULT 0,

  -- 心情
  `mood_scores`         JSON DEFAULT NULL,

  -- 亲子
  `kids_menu`           TINYINT(1) DEFAULT 0,
  `high_chair`          TINYINT(1) DEFAULT 0,

  -- 距离
  `nearest_poi_id`      BIGINT UNSIGNED DEFAULT NULL,
  `nearest_poi_distance` INT DEFAULT NULL COMMENT '距最近景点步行距离(米)',

  `rating`              DECIMAL(2,1) DEFAULT 0,
  `opening_hours`       VARCHAR(100) DEFAULT NULL,
  `tags`                JSON DEFAULT NULL,
  `status`              TINYINT DEFAULT 1,
  `created_at`          DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_city_cuisine` (`city`, `cuisine`),
  INDEX `idx_diet` (`is_diet_friendly`),
  INDEX `idx_nearby` (`nearest_poi_id`, `nearest_poi_distance`),
  INDEX `idx_rating` (`rating` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='餐厅表';
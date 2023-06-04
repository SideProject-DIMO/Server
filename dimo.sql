-- 회원 정보
CREATE TABLE `user` (
  `user_no` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(30) NOT NULL,
  `password` varchar(100) DEFAULT NULL,
  `name` varchar(10) NOT NULL,
  `sns_type` varchar(10) DEFAULT NULL,
  `agency` varchar(6) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `nickname` varchar(10) DEFAULT NULL,
  `mbti` varchar(5) NOT NULL,
  `refresh_token` varchar(200) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_no`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `nickname` (`nickname`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 인증번호
CREATE TABLE `sms_validation` (
  `phone_number` varchar(15) NOT NULL,
  `code` varchar(10) NOT NULL,
  `expire` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 콘텐츠 영화 
CREATE TABLE `movie_contents` (
  `title` varchar(50) NOT NULL,
  `genre` varchar(50) NOT NULL,
  `movie_id` int NOT NULL AUTO_INCREMENT,
  `running_time` varchar(10) NOT NULL,
  `story` varchar(500) NOT NULL,
  `poster_img` varchar(100) DEFAULT NULL,
  `character_img` varchar(100) DEFAULT NULL,
  `character_name` varchar(30) NOT NULL,
  `character_mbti` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`movie_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 콘텐츠 애니메이션 
CREATE TABLE `anime_contents` (
  `title` varchar(50) NOT NULL,
  `genre` varchar(50) NOT NULL,
  `anime_id` int NOT NULL AUTO_INCREMENT,
  `story` varchar(500) NOT NULL,
  `poster_img` varchar(100) DEFAULT NULL,
  `character_img` varchar(100) DEFAULT NULL,
  `character_name` varchar(30) NOT NULL,
  `character_mbti` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`anime_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- 회원 정보
CREATE TABLE `user` (
  `user_no` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(30) NOT NULL,
  `password` varchar(100) DEFAULT NULL,
  `name` varchar(10) NOT NULL,
  `sns_type` varchar(10) DEFAULT NULL,
  `agency` varchar(6) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `nickname` varchar(10) DEFAULT NULL,
  `mbti` varchar(5) DEFAULT NULL,
  `refresh_token` varchar(200) DEFAULT NULL,
  `updated_at_nickname` timestamp NULL DEFAULT NULL,
  `updated_at_mbti` timestamp NULL DEFAULT NULL,
  `intro` varchar(100) DEFAULT NULL,
  `profile_img` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`user_no`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `nickname` (`nickname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 인증번호
CREATE TABLE `sms_validation` (
  `phone_number` varchar(15) NOT NULL,
  `code` varchar(10) NOT NULL,
  `expire` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 콘텐츠 영화 
CREATE TABLE `movie_contents` (
  `movie_id` int NOT NULL AUTO_INCREMENT,
  `movie_content_id` int DEFAULT NULL,
  PRIMARY KEY (`movie_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 탈퇴 사유
CREATE TABLE `drop_reason` (
  `drop_id` int NOT NULL AUTO_INCREMENT,
  `drop_reason` varchar(100) NOT NULL,
  PRIMARY KEY (`drop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 콘텐츠 애니메이션 
CREATE TABLE `anime_contents` (
  `anime_id` int NOT NULL AUTO_INCREMENT,
  `anime_content_id` int DEFAULT NULL,
  `url_type` int NOT NULL, -- type 0이면 /nav/good, 1이면 /nav/quarter, 2면 /
  PRIMARY KEY (`anime_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 좋아요
CREATE TABLE `dimo_like` (
  `like_id` int(11) NOT NULL AUTO_INCREMENT,
  `content_type` varchar(10) NOT NULL,
  `content_id` int(11) NOT NULL,
  `user_id` varchar(30) NOT NULL,
  PRIMARY KEY (`like_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 평점
CREATE TABLE `dimo_grade` (
  `grade_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(30) NOT NULL,
  `content_id` int(11) NOT NULL,
  `content_type` varchar(10) NOT NULL,
  `grade` float NOT NULL,
  PRIMARY KEY (`grade_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

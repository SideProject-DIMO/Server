-- 회원 정보
CREATE TABLE `user` (
  `user_no` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `movie_id` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 탈퇴 사유
CREATE TABLE `drop_reason` (
  `drop_id` int NOT NULL AUTO_INCREMENT,
  `drop_reason` varchar(100) NOT NULL,
  PRIMARY KEY (`drop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 콘텐츠 애니메이션 
CREATE TABLE `anime_contents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `anime_id` int(11) NOT NULL,
  `title` varchar(50) DEFAULT NULL,
  `genre` varchar(80) DEFAULT NULL,
  `plot` varchar(1200) DEFAULT NULL,
  `poster_img` varchar(300) DEFAULT NULL,
  `director` varchar(40) DEFAULT NULL,
  `anime_release` varchar(40) DEFAULT NULL,
  `rate` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 애니메이션 캐릭터
CREATE TABLE `anime_character` (
  `character_id` int(11) NOT NULL AUTO_INCREMENT,
  `anime_id` int(11) NOT NULL,
  `character_img` varchar(300) DEFAULT NULL,
  `character_name` varchar(100) DEFAULT NULL,
  `character_mbti` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`character_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 콘텐츠 좋아요
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
  `grade` int(11) DEFAULT '0',
  `user_mbti` varchar(5) NOT NULL,
  PRIMARY KEY (`grade_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 애니메이션 캐릭터 투표
CREATE TABLE `anime_character_vote` (
  `vote_id` int(11) NOT NULL AUTO_INCREMENT,
  `character_id` int(11) NOT NULL,
  `user_mbti` varchar(4) NOT NULL,
  `user_id` varchar(30) NOT NULL,
  `energy` varchar(1) NOT NULL,
  `recognization` varchar(1) NOT NULL,
  `prediction` varchar(1) NOT NULL,
  `reaction` varchar(1) NOT NULL,
  `content_id` int(11) NOT NULL,
  `vote_mbti` varchar(5) NOT NULL,
  PRIMARY KEY (`vote_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 캐릭터에 리뷰하기
CREATE TABLE `character_review` (
  `review_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(30) NOT NULL,
  `character_id` int(11) NOT NULL,
  `review_content` varchar(500) NOT NULL,
  `review_like` int(11) DEFAULT '0',
  `review_hits` int(11) DEFAULT '0',
  `review_spoiler` int(11) DEFAULT '0',
  PRIMARY KEY (`review_id`),
  KEY `user_id` (`user_id`),
  KEY `character_id` (`character_id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 리뷰 댓글
CREATE TABLE `review_comment` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `review_id` int(11) NOT NULL,
  `user_id` varchar(30) NOT NULL,
  `comment_like` int(11) DEFAULT '0',
  `comment_content` varchar(500) NOT NULL,
  `comment_spoiler` int(11) DEFAULT '0',
  `character_id` int(11) NOT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `user_id` (`user_id`),
  KEY `review_id` (`review_id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 리뷰 좋아요
CREATE TABLE `review_like` (
  `review_like_id` int(11) NOT NULL AUTO_INCREMENT,
  `character_id` int(11) NOT NULL,
  `user_id` varchar(30) NOT NULL,
  `review_id` int(11) NOT NULL,
  PRIMARY KEY (`review_like_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 댓글 좋아요
CREATE TABLE `comment_like` (
  `comment_like_id` int(11) NOT NULL AUTO_INCREMENT,
  `character_id` int(11) NOT NULL,
  `user_id` varchar(30) NOT NULL,
  `review_id` int(11) NOT NULL,
  PRIMARY KEY (`comment_like_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 캐릭터 요청하기
CREATE TABLE `request_character` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(3) NOT NULL,
  `title` varchar(50) NOT NULL,
  `character_name` varchar(100) NOT NULL,
  PRIMARY KEY (`request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8mb4_general_ci;

-- 작성자 신고하기
CREATE TABLE `report_user` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `report_user_id` varchar(30) NOT NULL,
  `user_id` varchar(30) NOT NULL,
  `report_reason` varchar(100) NOT NULL,
  `review_id` int(11) NOT NULL,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8mb4_general_ci;

-- 리뷰 가리기
CREATE TABLE `blind_review` (
  `blind_id` int(11) NOT NULL AUTO_INCREMENT,
  `blind_review_id` int(11) NOT NULL,
  `blind_user_id` varchar(30) DEFAULT NULL,
  `user_id` varchar(30) NOT NULL,
  `character_id` int(11) NOT NULL,
  PRIMARY KEY (`blind_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8mb4_general_ci;

-- 최근 검색어 저장
CREATE TABLE `search_list` (
  `search_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(30) NOT NULL,
  `content` varchar(30) NOT NULL,
  PRIMARY KEY (`search_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 최근 본 캐릭터 저장
CREATE TABLE `recent_chr_list` (
  `recent_chr_list_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(30) NOT NULL,
  `character_id` varchar(30) NOT NULL,
  PRIMARY KEY (`recent_chr_list_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

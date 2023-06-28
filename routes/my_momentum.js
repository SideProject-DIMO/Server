const pool = require("../db");
const express = require("express");
const router = express.Router();

// 내 프로필 조회하기
router.get("/", async (req, res, next) => {
  const {user_id} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";

  try {
    const [my_profile] = await pool.execute(
      `SELECT name, nickname, mbti, intro, profile_img FROM user WHERE user_id = ?`,
      [user_id]
    );
    result_code = 200;
    message = "내 프로필 조회 성공";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      name: my_profile[0].name,
      nickname: my_profile[0].nickname,
      mbti: my_profile[0].mbti,
      intro: my_profile[0].intro,
      profile_img: my_profile[0].profile_img,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 내 프로필 수정하기
router.post("/mod_profile", async (req, res, next) => {
  const {user_id, profile_img, intro} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다";
  try {
    const [mod_profile] = await pool.execute(
      `UPDATE user SET profile_img = ?, intro = ? WHERE user_id = ?`,
      [profile_img, intro, user_id]
    );
    result_code = 200;
    message = "내 프로필 수정 성공";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 좋아요 누른 애니메이션 조회하기
router.get("/like_anime_content", async (req, res, next) => {
  const {user_id} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    const [my_like_content] = await pool.execute(
      `SELECT content_id FROM dimo_like WHERE user_id = ? and content_type = 'anime'`,
      [user_id]
    );
    if (my_like_content[0] == null) {
      result_code = 201;
      message = "좋아요 누른 애니메이션 없음";
    } else {
      result_code = 200;
      message = "좋아요 누른 애니메이션 조회 성공";
    }

    return res.json({
      code: result_code,
      message: message,
      like_content: my_like_content,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 좋아요 누른 영화 조회하기
router.get("/like_movie_content", async (req, res, next) => {
  const {user_id} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    const [my_like_content] = await pool.execute(
      `SELECT content_id FROM dimo_like WHERE user_id = ? and content_type = 'movie'`,
      [user_id]
    );
    if (my_like_content[0] == null) {
      result_code = 201;
      message = "좋아요 누른 영화 없음";
    } else {
      result_code = 200;
      message = "좋아요 누른 영화 조회 성공";
    }

    return res.json({
      code: result_code,
      message: message,
      like_content: my_like_content,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;

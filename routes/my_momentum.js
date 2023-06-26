const pool = require("../db");
const express = require("express");
const router = express.Router();

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
    message = "내 정보 조회 성공";
    return res.json({
      code: result_code,
      message: message,
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

module.exports = router;

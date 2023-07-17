const pool = require("../db");
const puppeteer = require("puppeteer");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res, next) => {
  const user_id = req.query.user_id;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    let rand_num = [];

    for (let i = 0; i < 5; i++) {
      rand_num[i] = Math.floor(Math.random() * (100 - 1) + 1); //1~100까지 랜덤 선택
    }

    let [represent] = await pool.execute(
      `SELECT * FROM anime_contents WHERE id = ? or id = ? or id = ? or id = ? or id= ?`,
      [rand_num[0], rand_num[1], rand_num[2], rand_num[3], rand_num[4]]
    ); //랜덤 콘텐츠 

    let [recommend] = await pool.execute(
      `SELECT * FROM anime_contents WHERE anime_id in (SELECT content_id FROM dimo_like WHERE user_id in (SELECT user_id FROM user WHERE mbti = (SELECT mbti FROM user WHERE user_id = ?))) LIMIT 10`,
      [user_id]
    ); //같은 mbti 사용자가 추천한 영화

    result_code = 200;
    message = "홈 화면 조회에 성공했습니다.";
    return res.json({
      code: result_code,
      message: message,
      contents: [
        {category: "represent", represent},
        {category: "recommend", recommend},
      ],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

module.exports = router;

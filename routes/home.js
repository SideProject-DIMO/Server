const pool = require("../db");
const puppeteer = require("puppeteer");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res, next) => {
  const user_id = req.query.user_id;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    let [home] = await pool.execute(`SELECT * FROM anime_contents`); //카테고리나 제약 조건 추가.. + 랜덤성

    result_code = 200;
    message = "홈 화면 조회에 성공했습니다.";
    return res.json({
      code: result_code,
      message: message,
      contents: home,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

module.exports = router;

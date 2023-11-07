const pool = require("../db");
const express = require("express");
const router = express.Router();

// 캐릭터 요청하기
router.post("/request_character", async (req, res, next) => {
  let {user_id, category, title, character_name} = req.body;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `INSERT INTO request_character(category, title, character_name) VALUES (?, ?, ?)`,
      [category, title, character_name]
    );

    result_code = 200;
    message = "캐릭터를 성공적으로 요청했습니다.";

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

module.exports = router;

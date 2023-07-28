const pool = require("../db");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res, next) => {
  // 리뷰 조회
  const {user_id, character_id} = req.query;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `UPDATE character_review SET review_hits = review_hits + 1 WHERE character_id = ?`,
      [character_id]
    );
    let [view_review] = await pool.execute(
      `SELECT * FROM character_review WHERE character_id = ?`,
      [character_id]
    );
    result_code = 200;
    message = "리뷰 조회 성공";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      review_list: view_review,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.post("/write_review", async (req, res, next) => {
  //리뷰 작성
  const {user_id, character_id, review_content, review_spoiler} = req.body;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `INSERT INTO character_review(user_id, character_id, review_content, review_spoiler) VALUES (?, ?, ?, ?)`,
      [user_id, character_id, review_content, review_spoiler]
    );
    result_code = 200;
    message = "리뷰 작성 성공";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_id: character_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

module.exports = router;

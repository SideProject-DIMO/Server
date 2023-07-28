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
    message = "리뷰를 조회했습니다.";
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
    message = "리뷰를 작성했습니다.";
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

router.post("/review_like", async (req, res, next) => {
  //리뷰 좋아요 누르기
  const {user_id, character_id, review_id} = req.body;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    let [is_like] = await pool.execute(
      `SELECT * FROM review_like WHERE user_id = ? and review_id = ?`,
      [user_id, review_id]
    );

    if (is_like[0] == null) {
      await pool.execute(
        `INSERT INTO review_like (character_id, user_id, review_id) VALUES (?, ?, ?)`,
        [character_id, user_id, review_id]
      );
      await pool.execute(
        `UPDATE character_review SET review_like = review_like + 1 WHERE review_id = ?`,
        [review_id]
      );
      result_code = 200;
      message = "좋아요를 눌렀습니다.";
    } else {
      result_code = 201;
      message = "이미 좋아요를 누른 리뷰입니다.";
    }

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_id: character_id,
      review_id: review_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.post("/review_dislike", async (req, res, next) => {
  //리뷰 좋아요 취소하기
  const {user_id, character_id, review_id} = req.body;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `DELETE FROM review_like WHERE review_id = ? and user_id = ?`,
      [review_id, user_id]
    );
    await pool.execute(
      `UPDATE character_review SET review_like = review_like - 1 WHERE review_id = ?`,
      [review_id]
    );
    result_code = 200;
    message = "좋아요를 취소했습니다.";

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_id: character_id,
      review_id: review_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.delete("/delete_review", async (req, res, next) => {
  //리뷰 삭제하기
  const {user_id, character_id, review_id} = req.body;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(`DELETE FROM review_like WHERE review_id = ?`, [
      review_id,
    ]);
    await pool.execute(`DELETE FROM character_review WHERE review_id = ?`, [
      review_id,
    ]);
    result_code = 200;
    message = "리뷰를 삭제했습니다.";

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

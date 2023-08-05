const pool = require("../db");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res, next) => {
  // 리뷰 전체 조회하기
  const {user_id, character_id} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let [view_review] = await pool.execute(
      `SELECT review_id, user.user_id, character_id, review_content, review_like, review_hits, review_spoiler, nickname, mbti, profile_img FROM character_review JOIN user ON character_review.user_id = user.user_id WHERE character_id = ?`,
      [character_id]
    );
    for (let rev of view_review) {
      let [comment_count] = await pool.execute(
        `SELECT COUNT(*) AS count FROM review_comment WHERE review_id = ? `,
        [rev.review_id]
      );

      if (comment_count[0].count != 0) {
        rev.comment_count = comment_count[0].count;
      } else {
        rev.comment_count = 0;
      }
    }

    result_code = 200;
    message = "전체 리뷰를 조회했습니다.";
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

router.get("/review_detail", async (req, res, next) => {
  // 리뷰 상세 조회하기
  const {user_id, character_id, review_id} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `UPDATE character_review SET review_hits = review_hits + 1 WHERE review_id = ?`,
      [review_id]
    );
    let [view_review] = await pool.execute(
      `SELECT review_id, user.user_id, character_id, review_content, review_like, review_hits, review_spoiler, nickname, mbti, profile_img FROM character_review JOIN user ON character_review.user_id = user.user_id WHERE review_id = ?`,
      [review_id]
    );

    let [comment_count] = await pool.execute(
      `SELECT COUNT(*) AS count FROM review_comment WHERE review_id = ? `,
      [review_id]
    );

    let [is_liked] = await pool.execute(
      `SELECT * FROM review_like WHERE review_id = ? and user_id = ?`,
      [review_id, user_id]
    );
    if (is_liked[0] == null) is_liked = "";

    view_review.comment_count = comment_count[0].count;

    result_code = 200;
    message = "상세 리뷰를 조회했습니다.";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_id: character_id,
      review_list: view_review,
      is_liked: is_liked, //좋아요 누른 리뷰인지
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.post("/write_review", async (req, res, next) => {
  //리뷰 작성하기
  const {user_id, character_id, review_content, review_spoiler} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let [insert_review] = await pool.execute(
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
      review_id: insert_review.insertId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.post("/review_like", async (req, res, next) => {
  //리뷰 좋아요 누르기
  const {user_id, character_id, review_id} = req.body;
  let result_code = 404;
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
  let result_code = 404;
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

router.post("/modify_review", async (req, res, next) => {
  //리뷰 수정하기
  const {user_id, character_id, review_content, review_spoiler, review_id} =
    req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `UPDATE character_review SET review_content = ?, review_spoiler = ? WHERE review_id = ?`,
      [review_content, review_spoiler, review_id]
    );

    result_code = 200;
    message = "리뷰를 수정했습니다.";

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
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let [is_review_exist] = await pool.execute(
      `SELECT * FROM review_like WHERE review_id = ?`,
      [review_id]
    );
    if (is_review_exist[0] != null) {
      await pool.execute(`DELETE FROM review_like WHERE review_id = ?`, [
        review_id,
      ]);
    }
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

router.get("/comment", async (req, res, next) => {
  //댓글 조회하기
  const {user_id, review_id} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  let [is_liked] = "";

  try {
    let [view_comment] = await pool.execute(
      `SELECT * FROM review_comment WHERE review_id = ?`,
      [review_id]
    );

    for (let comment of view_comment) {
      [is_liked] = await pool.execute(
        `SELECT * FROM comment_like WHERE user_id = ? and comment_id = ?`,
        [user_id, comment.comment_id]
      );
      if (is_liked[0] == null) comment.is_liked = "";
      else comment.is_liked = is_liked[0];
    }

    result_code = 200;
    message = "리뷰를 조회했습니다.";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      comment_list: view_comment,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.post("/write_comment", async (req, res, next) => {
  //댓글 쓰기
  const {user_id, character_id, review_id, comment_content, comment_spoiler} =
    req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let [insert_comment] = await pool.execute(
      `INSERT INTO review_comment (review_id, user_id, comment_content, comment_spoiler, character_id) VALUES (?, ?, ?, ?, ?)`,
      [review_id, user_id, comment_content, comment_spoiler, character_id]
    );
    result_code = 200;
    message = "댓글을 작성했습니다.";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_id: character_id,
      comment_id: insert_comment.insertId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.post("/modify_comment", async (req, res, next) => {
  //댓글 수정하기
  const {user_id, character_id, comment_content, comment_spoiler, comment_id} =
    req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `UPDATE review_comment SET comment_content = ?, comment_spoiler = ? WHERE comment_id = ?`,
      [comment_content, comment_spoiler, comment_id]
    );

    result_code = 200;
    message = "댓글을 수정했습니다.";

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_id: character_id,
      comment_id: comment_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.delete("/delete_comment", async (req, res, next) => {
  //댓글 삭제하기
  const {user_id, character_id, review_id, comment_id} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let [is_comment_exist] = await pool.execute(
      `SELECT * FROM comment_like WHERE comment_id = ?`,
      [comment_id]
    );
    if (is_comment_exist[0] != null) {
      await pool.execute(`DELETE FROM comment_like WHERE comment_id = ?`, [
        comment_id,
      ]);
    }
    await pool.execute(`DELETE FROM review_comment WHERE comment_id = ?`, [
      comment_id,
    ]);
    result_code = 200;
    message = "댓글을 삭제했습니다.";

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

router.post("/like_comment", async (req, res, next) => {
  //댓글에 좋아요 누르기
  const {user_id, character_id, comment_id} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let [is_like] = await pool.execute(
      `SELECT * FROM comment_like WHERE user_id = ? and comment_id = ?`,
      [user_id, character_id]
    );

    if (is_like[0] == null) {
      await pool.execute(
        `INSERT INTO comment_like (character_id, user_id, comment_id) VALUES (?, ?, ?)`,
        [character_id, user_id, comment_id]
      );
      await pool.execute(
        `UPDATE review_comment SET comment_like = comment_like + 1 WHERE comment_id = ?`,
        [comment_id]
      );
      result_code = 200;
      message = "좋아요를 눌렀습니다.";
    } else {
      result_code = 201;
      message = "이미 좋아요를 누른 댓글입니다.";
    }

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_id: character_id,
      comment_id: comment_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.post("/dislike_comment", async (req, res, next) => {
  //댓글에 좋아요 취소하기
  const {user_id, character_id, comment_id} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `DELETE FROM comment_like WHERE comment_id = ? and user_id = ?`,
      [comment_id, user_id]
    );
    await pool.execute(
      `UPDATE review_comment SET comment_like = comment_like - 1 WHERE comment_id = ?`,
      [comment_id]
    );
    result_code = 200;
    message = "좋아요를 취소했습니다.";

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_id: character_id,
      comment_id: comment_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

module.exports = router;

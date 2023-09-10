//회원탈퇴
const pool = require("../db");
const express = require("express");
const router = express.Router();

router.post("/", async (req, res, next) => {
  const {user_id, drop_reason} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다";

  try {
    const [data] = await pool.execute(
      `SELECT user_id FROM user WHERE user_id = ?`,
      [user_id]
    );
    if (data[0] != null) {
      await pool.execute(`DELETE FROM blind_review WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM character_review WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM comment_like WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM dimo_grade WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM dimo_like WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM report_user WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM review_comment WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM review_like WHERE user_id = ?`, [user_id]);
      await pool.execute(`UPDATE anime_character_vote SET user_id = '알수없음' WHERE user_id = ?`, [user_id]);

      const [drop_user] = await pool.execute(
        `DELETE FROM user WHERE user_id = ?`,
        [user_id]
      );
      const [reason] = await pool.execute(
        `UPDATE drop_reason SET drop_reason = ?`,
        [drop_reason]
      );
      result_code = 200;
      message = "회원 탈퇴가 완료되었습니다.";
    } else {
      result_code = 201;
      message = "회원 정보가 없습니다.";
    }
    res.send({
      message: message,
      code: result_code,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;

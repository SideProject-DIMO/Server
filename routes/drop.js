//회원탈퇴
const pool = require("../db");
const express = require("express");
const router = express.Router();

router.post("/drop", async (req, res, next) => {
  const {user_id} = req.body;
  let resultCode = 404;
  let message = "에러가 발생했습니다";

  try {
    const [data] = await pool.execute(
      `SELECT user_id FROM user WHERE user_id = ?`,
      [user_id]
    );
    if (data[0] != undefined) {
      const [drop_user] = await pool.execute(
        `DELETE FROM user WHERE user_id = ?`,
        [user_id]
      );
      resultCode = 200;
      message = "회원 탈퇴가 완료되었습니다.";
    } else {
      resultCode = 201;
      message = "회원 정보가 없습니다.";
    }
    res.send({
      message: message,
      code: resultCode,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;

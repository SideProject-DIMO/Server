const pool = require("../db");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

// 비밀번호 변경
router.get("/change_pw", async (req, res, next) => {
  let user_id = req.body.user_id;
  let password = req.body.password;
  let passwordBy = bcrypt.hashSync(password, 10); // sync
  try {
    const [change_pw] = await pool.execute(
      `UPDATE user SET password = ? where user_id = ?`,
      [passwordBy, user_id]
    );

    if (change_pw[0] == undefined) {
      message = "id_not_exist";
    }

    resultCode = 200;
    message = "비밀번호가 성공적으로 변경되었습니다.";

    return res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 닉네임 중복 확인
router.get("/confirm_nickname", async (req, res, next) => {
  let user_id = req.body.user_id;
  let nickname = req.body.nickname;
  try {
    const [nickname_dp] = await pool.execute(
      `SELECT nickname FROM user WHERE nickname = ?`,
      [nickname]
    );

    if (nickname_dp[0] == undefined) {
      resultCode = 200;
      message = "사용 가능한 닉네임입니다.";
    } else {
      resultCode = 401;
      message = "중복된 닉네임이 존재합니다.";
    }
    return res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 닉네임 변경
router.get("/change_nickname", async (req, res, next) => {
  let user_id = req.body.user_id;
  let nickname = req.body.nickname;
  try {
    let now = new Date();
    const [change_nickname] = await pool.execute(
      `UPDATE user SET nickname = ?, updated_at = ? where user_id = ?`,
      [nickname, now, user_id]
    );

    resultCode = 200;
    message = "닉네임이 성공적으로 변경되었습니다.";

    return res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
      nickname: nickname,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;

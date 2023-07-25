const pool = require("../db");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

// 회원정보 받아오기(nickname, mbti, updated_at)
router.get("/", async (req, res, next) => {
  let user_id = req.query.user_id;

  try {
    const [check_user_info] = await pool.execute(
      `SELECT nickname, mbti, updated_at_nickname, updated_at_mbti FROM user WHERE user_id = ?`,
      [user_id]
    );
    resultCode = 200;
    message = "회원정보를 성공적으로 조회했습니다.";

    return res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
      nickname: check_user_info[0].nickname,
      mbti: check_user_info[0].mbti,
      updated_at_nickname: check_user_info[0].updated_at_nickname,
      updated_at_mbti: check_user_info[0].updated_at_mbti,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 비밀번호 변경
router.get("/change_pw", async (req, res, next) => {
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  let user_id = req.query.user_id;
  let password = req.query.password; //원래 비밀번호
  let new_password = req.query.new_password; //새로운 비밀번호
  // let password_by = bcrypt.hashSync(password, 10); // sync
  let new_password_by = bcrypt.hashSync(new_password, 10); // sync

  try {
    const [is_pw_dup] = await pool.execute(
      `SELECT password from user where user_id = ?`,
      [user_id]
    );

    if (!(await bcrypt.compare(password, is_pw_dup[0].password))) {
      result_code = 401;
      message_confirm_pw = "기존 비밀번호를 잘못 입력했습니다.";
    } else {
      message_confirm_pw = "";
      //select가 undefined 라면
      if (is_pw_dup[0] == undefined) {
        result_code = 402;
        message = "존재하지 않는 아이디입니다.";
      } //비밀번호 복호화 시, 입력한 값과 동일할 경우
      else if (await bcrypt.compare(new_password, is_pw_dup[0].password)) {
        result_code = 402;
        message = "같은 비밀번호가 입력되었습니다.";
      } else {
        result_code = 200;
        message = "비밀번호가 성공적으로 변경되었습니다.";
      }

      const [change_pw] = await pool.execute(
        `UPDATE user SET password = ? where user_id = ?`,
        [new_password_by, user_id]
      );
    }

    let [sql_password] = await pool.execute(
      `SELECT password FROM user WHERE user_id = ?`,
      [user_id]
    );

    return res.json({
      code: result_code,
      message: message,
      message_confirm_pw: message_confirm_pw,
      past_password: is_pw_dup[0].password,
      new_password: sql_password[0].password,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 닉네임 중복 확인
router.get("/confirm_nickname", async (req, res, next) => {
  let user_id = req.query.user_id;
  let nickname = req.query.nickname;
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

//닉네임 수정날짜 확인
router.get("/confirm_nickname_modify", async (req, res, next) => {
  let user_id = req.query.user_id;
  try {
    const [nick_mod_time] = await pool.execute(
      `SELECT updated_at_nickname FROM user WHERE user_id = ?`,
      [user_id]
    );
    let now = new Date();
    // 한달 = 2592000000밀리초

    if (
      nick_mod_time[0].updated_at_nickname != null &&
      now.getTime() - nick_mod_time[0].updated_at_nickname.getTime() <
        2592000000
    ) {
      resultCode = 401;
      message = "닉네임은 한 달에 한 번만 변경할 수 있습니다.";
    } else {
      resultCode = 200;
      message = "닉네임을 변경할 수 있습니다.";
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
  let user_id = req.query.user_id;
  let nickname = req.query.nickname;
  try {
    let now = new Date();

    const [change_nickname] = await pool.execute(
      `UPDATE user SET nickname = ?, updated_at_nickname = ? where user_id = ?`,
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

//mbti 수정날짜 확인
router.get("/confirm_mbti_modify", async (req, res, next) => {
  let user_id = req.query.user_id;
  try {
    const [confirm_mbti] = await pool.execute(
      `SELECT updated_at_mbti FROM user WHERE user_id = ?`,
      [user_id]
    );

    let now = new Date();

    if (
      confirm_mbti[0].updated_at_mbti != null &&
      now.getTime() - confirm_mbti[0].updated_at_mbti.getTime() < 2592000000
    ) {
      resultCode = 401;
      message = "mbti는 한 달에 한 번만 변경할 수 있습니다.";
    } else {
      resultCode = 200;
      message = "mbti를 변경할 수 있습니다.";
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

// mbti 변경
router.get("/change_mbti", async (req, res, next) => {
  let user_id = req.query.user_id;
  let mbti = req.query.mbti;
  try {
    const [confirm_mbti] = await pool.execute(
      `SELECT mbti FROM user WHERE user_id = ?`,
      [user_id]
    );

    console.log(confirm_mbti[0]);

    let now = new Date();

    if (confirm_mbti[0].mbti == mbti) {
      resultCode = 401;
      message = "바꾸려는 mbti가 동일합니다.";
      return res.json({
        code: resultCode,
        message: message,
        user_id: user_id,
      });
    }

    const [change_mbti] = await pool.execute(
      `UPDATE user SET mbti = ?, updated_at_mbti = ? WHERE user_id = ?`,
      [mbti, now, user_id]
    );

    resultCode = 200;
    message = "mbti가 성공적으로 변경되었습니다.";

    return res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
      mbti: mbti,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;

const pool = require("../db");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();

router.post("/", async (req, res, next) => {
  const {user_id, push_check, nickname, mbti} = req.body;
  let resultCode = 404;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(`UPDATE user SET push_check = ? WHERE user_id = ?`, [
      push_check,
      user_id,
    ]);
    let [insert_mbti] = await pool.execute(
      `UPDATE user SET nickname =?, mbti =? WHERE user_id =?`,
      [nickname, mbti, user_id]
    );
    resultCode = 200;
    message = "nickname과 mbti가 저장되었습니다.";
    return res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
      nickname: nickname,
      mbti: mbti,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

router.get("/check", async (req, res, next) => {
  const {user_id, sns_type} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다";

  // try {
  //   let [check_user_id] = await pool.execute(
  //     `SELECT user_id FROM user WHERE user_id = ? and sns_type = ?`,
  //     [user_id, sns_type]
  //   );
  //   if (check_user_id[0] == undefined) {
  //     result_code = 201;
  //     message = "가입된 사용자가 아닙니다.";
  //   } else {
  //     result_code = 200;
  //     message = "가입된 사용자입니다.";
  //   }
  //   return res.json({
  //     code: result_code,
  //     message: message,
  //     user_id: user_id,
  //   });
  // } catch (err) {
  //   console.error(err);
  //   return res.status(500).json(err);
  // }

  try {
    let [check_user_id] = await pool.execute(
      `SELECT nickname FROM user WHERE user_id = ? and sns_type = ?`,
      [user_id, sns_type]
    );
    console.log(check_user_id[0].nickname);
    console.log(check_user_id[0]);

    if (check_user_id[0].nickname == null) {
      result_code = 201;
      message = "가입된 사용자가 아닙니다.";
    } else {
      result_code = 200;
      message = "가입된 사용자입니다.";
    }
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

router.post("/google_login", async (req, res, next) => {
  const {user_id, name, sns_type} = req.body;
  let resultCode = 404;
  let message = "에러가 발생했습니다";
  let refresh_token, access_token;

  try {
    let [data] = await pool.execute("SELECT * FROM user WHERE user_id = ?", [
      user_id,
    ]);

    console.log(data[0]);

    //계정이 없다면
    access_token = await jwt.sign(
      {
        user_id: user_id,
        name: name,
      },
      process.env.jwt_secret,
      {
        expiresIn: "1h",
      } //만료 시간 1시간
    );

    refresh_token = await jwt.sign(
      {
        user_id: user_id,
      },
      process.env.jwt_secret,
      {
        expiresIn: "14d",
      }
    );

    res.cookie("access_token", access_token, {
      httpOnly: true,
      maxAge: 60000 * 60,
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      maxAge: 60000 * 60 * 24 * 14,
    });
    if (data[0] == undefined) {
      let [data2] = await pool.execute(
        "INSERT INTO user (user_id, name, sns_type, refresh_token) VALUES (?, ?, ?, ?)",
        [user_id, name, sns_type, refresh_token]
      );
      resultCode = 200;
      message = "구글 계정 회원가입 성공!";

      console.log("Google Signup Success!");
    } else {
      //로그인
      let [data2] = await pool.execute(
        "UPDATE user SET refresh_token=? WHERE user_id = ?",
        [refresh_token, user_id]
      );
      resultCode = 200;
      message = data[0].name + "님 환영합니다!";

      console.log("Google Login Success!");
    }
    return res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
      access_token: access_token,
      refresh_token: refresh_token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

router.post("/kakao_login", async (req, res, next) => {
  const {user_id, name, sns_type} = req.body;

  let resultCode = 404;
  let message = "에러가 발생했습니다.";
  let refresh_token, access_token;

  try {
    let [data] = await pool.execute("SELECT * FROM user WHERE user_id = ?", [
      user_id,
    ]);

    access_token = await jwt.sign(
      {
        user_id: user_id,
        name: name,
      },
      process.env.jwt_secret,
      {
        expiresIn: "1h",
      } //만료 시간 1시간
    );

    refresh_token = await jwt.sign(
      {
        user_id: user_id,
      },
      process.env.jwt_secret,
      {
        expiresIn: "14d",
      }
    );

    res.cookie("access_token", access_token, {
      httpOnly: true,
      maxAge: 60000 * 60,
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      maxAge: 60000 * 60 * 24 * 14,
    });
    if (data[0] == undefined) {
      data = await pool.execute(
        "INSERT INTO user (user_id, name, sns_type, refresh_token) VALUES (?, ?, ?, ?)",
        [user_id, name, sns_type, refresh_token]
      );
      resultCode = 200;
      message = "카카오 계정 회원가입 성공!";
      console.log("Kakao Signup Success!");

    } else {
      //로그인
      let [data2] = await pool.execute(
        "UPDATE user SET refresh_token=? WHERE user_id = ?",
        [refresh_token, user_id]
      );
      resultCode = 200;
      message = data[0].name + "님 환영합니다!";

      console.log("Kakao Login Success!");

    }
    res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
      access_token: access_token,
      refresh_token: refresh_token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

router.post("/apple_login", async (req, res, next) => {
  const {user_id, name, sns_type} = req.body;

  let resultCode = 404;
  let message = "에러가 발생했습니다.";
  let refresh_token, access_token;

  try {
    let [data] = await pool.execute("SELECT * FROM user WHERE user_id = ?", [
      user_id,
    ]);

    access_token = await jwt.sign(
      {
        user_id: user_id,
        name: name,
      },
      process.env.jwt_secret,
      {
        expiresIn: "1h",
      } //만료 시간 1시간
    );

    refresh_token = await jwt.sign(
      {
        user_id: user_id,
      },
      process.env.jwt_secret,
      {
        expiresIn: "14d",
      }
    );

    res.cookie("access_token", access_token, {
      httpOnly: true,
      maxAge: 60000 * 60,
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      maxAge: 60000 * 60 * 24 * 14,
    });
    if (data[0] == undefined) {
      data = await pool.execute(
        "INSERT INTO user (user_id, name, sns_type, refresh_token) VALUES (?, ?, ?, ?)",
        [user_id, name, sns_type, refresh_token]
      );
      resultCode = 200;
      message = "애플 계정 회원가입 성공!";
    } else {
      //로그인
      let [data2] = await pool.execute(
        "UPDATE user SET refresh_token=? WHERE user_id = ?",
        [refresh_token, user_id]
      );
      resultCode = 200;
      message = data[0].name + "님 환영합니다!";
    }
    res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
      access_token: access_token,
      refresh_token: refresh_token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

const get_cookies = (req) => {
  if (req.headers.cookie) {
    let cookies = {};
    req.headers &&
      req.headers.cookie.split(";").forEach(function (cookie) {
        let parts = cookie.match(/(.*?)=(.*)$/);
        cookies[parts[1].trim()] = (parts[2] || "").trim();
      });
    return cookies;
  } else return undefined;
};

// access_token 만료 -> refresh token 을 이용해 재발급
router.get("/refresh", async (req, res) => {
  let refresh_token = get_cookies(req);

  if (refresh_token === undefined) {
    res.sendStatus(400);
  } else {
    refresh_token = refresh_token["refresh_token"];
    try {
      const refresh_verify = jwt.verify(refresh_token, process.env.jwt_secret);

      const [user, fields] = await db.execute(
        "SELECT * FROM user WHERE user_id = ?",
        [refresh_verify.user_id]
      );
      const access_token = await jwt.sign(
        {
          user_id: user[0].user_id,
          name: user[0].name,
        },
        process.env.jwt_secret,
        {
          expiresIn: "1h",
        }
      );

      res.cookie("access_token", access_token, {
        httpOnly: true,
        maxAge: 60000 * 60,
        overwrite: true,
      });
      res.send({
        access_token: access_token,
        refresh_token: refresh_token,
      });
    } catch (e) {
      res.status(401).send({
        msg: "retry login",
      });
    }
  }
});

module.exports = router;

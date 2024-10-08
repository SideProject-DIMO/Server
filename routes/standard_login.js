const pool = require("../db");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const msgModule = require('coolsms-node-sdk').default

require("dotenv").config();

router.post("/", async (req, res, next) => {
  const {user_id, password} = req.body;
  let resultCode = 404;
  let message = "에러가 발생했습니다";

  try {
    //문제 없으면 try문 실행
    const data = await pool.query("SELECT * FROM user WHERE user_id = ?", [
      user_id,
    ]);
    if (data[0][0] == undefined) {
      // 계정이 없다면
      resultCode = 206;
      message = "존재하지 않는 계정입니다!";
      access_token = "id_false";
      return res.json({
        code: resultCode,
        message: message,
        user_id: user_id,
        access_token: access_token,
        refresh_token: "",
      });
    } else if (!bcrypt.compareSync(password, data[0][0].password)) {
      // 비밀번호가 다르다면
      resultCode = 204;
      message = "비밀번호가 틀렸습니다!";
      access_token = "pwd_false";
      return res.json({
        code: resultCode,
        message: message,
        user_id: user_id,
        access_token: access_token,
        refresh_token: "",
      });
    } else {
      // 다른 경우는 없다고 판단하여 성공
      resultCode = 200;
      message = "로그인 성공! " + data[0][0].nickname + "님 환영합니다!";

      const access_token = await jwt.sign(
        {
          user_id: data[0][0].user_id,
          name: data[0][0].name,
          nickname: data[0][0].nickname,
        },
        process.env.jwt_secret,
        {
          expiresIn: "1h",
        } //만료 시간 1시간
      );

      const refresh_token = await jwt.sign(
        {
          user_id: data[0][0].user_id,
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

      const insertRef = await pool.query(
        `UPDATE user SET refresh_token = ? where user_id = ?`,
        [refresh_token, user_id]
      );
      return res.json({
        code: resultCode,
        message: message,
        user_id: user_id,
        access_token: access_token,
        refresh_token: refresh_token,
      });
    }
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
          nickname: user[0].nickname,
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

router.get("/find_id", async (req, res, next) => {
  let {name, agency, phone_number, ver_code} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  let [find_id] = "";
  let user_id, user_name;
  try {
    let [val_num] = await pool.execute(
      `SELECT * FROM sms_validation WHERE phone_number = ? and code = ?`,
      [phone_number, ver_code]
    );

    if (val_num[0] == null) {
      result_code = 400;
      message = "유효하지 않는 코드입니다.";
      user_id = "";
      user_name = "";
    } else {
      [find_id] = await pool.execute(
        `SELECT user_id, name FROM user WHERE name = ? and agency = ? and phone_number = ?`,
        [name, agency, phone_number]
      );
      if (find_id[0] == null) {
        result_code = 401;
        message = "존재하지 않는 사용자 정보입니다.";
        user_id = "";
        user_name = "";
      } else {
        result_code = 200;
        message = "아이디를 조회했습니다.";
        user_id = find_id[0].user_id;
        user_name = find_id[0].name;
      }
    }
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      name: user_name,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

router.post("/find_pw", async (req, res, next) => {
  let {user_id, phone_number} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  let code = "";
  for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10);

  try {
    let [exist_user] = await pool.execute(
      `SELECT * FROM user WHERE user_id = ?`,
      [user_id]
    );

    if (exist_user[0] == null) {
      result_code = 400;
      message = "존재하지 않는 사용자 정보입니다.";
    } else {
      // 인증을 위해 발급받은 API Key를 사용합니다.
      const messageService = new msgModule(process.env.sms_api_key, process.env.sms_api_secret);

      const params = {
        text: `DIMO의 일회용 비밀번호는 ${code}입니다.`, // 문자 내용
        to: `${phone_number}`, // 수신번호 (받는이)
        from: '01036205872' // 발신번호 (보내는이)
      }
      messageService.sendMany([params]).then(console.log).catch(console.error)
      const password_bcrypt = bcrypt.hashSync(code, 10); // sync
      await pool.execute(`UPDATE user SET password = ? WHERE user_id = ?`, [
        password_bcrypt,
        user_id,
      ]);
      result_code = 200;
      message = "비밀번호를 업데이트 했습니다.";
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

module.exports = router;

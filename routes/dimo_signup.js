const pool = require("../db");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");

//회원가입
router.post("/", async (req, res, next) => {
  const {
    user_id,
    password,
    name,
    sns_type,
    agency,
    phone_number,
    nickname,
    mbti,
  } = req.body;
  const password_bcrypt = bcrypt.hashSync(password, 10); // sync
  let resultCode = 404;
  const access_token = await jwt.sign(
    {
      user_id: user_id,
      name: name,
      nickname: nickname,
    },
    process.env.jwt_secret,
    {expiresIn: "1h"} //만료 시간 1시간
  );

  const refresh_token = await jwt.sign(
    {
      user_id: user_id,
    },
    process.env.jwt_secret,
    {expiresIn: "14d"}
  );
  let message = "에러가 발생했습니다.";
  try {
    //문제 없으면 try문 실행
    const [data] = await pool.execute(
      "INSERT INTO user (user_id, password, name, sns_type, agency, phone_number, nickname, mbti, refresh_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user_id,
        password_bcrypt,
        name,
        sns_type,
        agency,
        phone_number,
        nickname,
        mbti,
        refresh_token,
      ]
    );
    resultCode = 200;
    message = name + "님, 회원가입에 성공했습니다!";
    return res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
      refresh_token: refresh_token,
    });
  } catch (err) {
    //에러 처리
    return res.status(500).json(err);
  }
});

// sms 인증
// function makeSignature(time) {
//   var space = " "; // one space
//   var newLine = "\n"; // new line
//   var method = "POST"; // method
//   var url = `/sms/v2/services/${process.env.naver_id}/messages`; // url (include query string)
//   var timestamp = time; // current timestamp (epoch)
//   var accessKey = process.env.naver_access; // access key id (from portal or Sub Account)
//   var secretKey = process.env.naver_console_secret; // secret key (from portal or Sub Account)

//   var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
//   hmac.update(method);
//   hmac.update(space);
//   hmac.update(url);
//   hmac.update(newLine);
//   hmac.update(timestamp);
//   hmac.update(newLine);
//   hmac.update(accessKey);

//   var hash = hmac.finalize();

//   return hash.toString(CryptoJS.enc.Base64);
// }

router.post("/phone-check", async (req, res) => {
  const body = req.body;
  const phone_number = body.phone_number;
  console.log(body);

  const sms_url = `https://sens.apigw.ntruss.com/sms/v2/services/${process.env.naver_id}/messages`;
  const time_stamp = Date.now().toString();
  // const signature = makeSignature(time_stamp);
  let code = "";
  for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10);
  try {
    // const sms_res = await axios.post(
    //   sms_url,
    //   {
    //     type: "SMS",
    //     from: "번호",
    //     countryCode: "82",
    //     content: `Dimo 인증번호는 [${code}]입니다.`,
    //     messages: [
    //       {
    //         to: phone_number,
    //         content: `Dimo 인증번호는 [${code}]입니다.`,
    //       },
    //     ],
    //   },
    //   {
    //     headers: {
    //       "Content-Type": "application/json; charset=utf-8",
    //       "x-ncp-apigw-timestamp": time_stamp,
    //       "x-ncp-iam-access-key": process.env.naver_access,
    //       "x-ncp-apigw-signature-v2": signature,
    //     },
    //   }
    // );
    const [result] = await pool.execute(
      `INSERT INTO sms_validation(phone_number, code, expire) VALUES (?, ?, NOW() + INTERVAL 3 MINUTE) ON DUPLICATE KEY UPDATE code = ?, expire = NOW() + INTERVAL 3 MINUTE`,
      [phone_number, code, code]
    );
    res.send({
      msg: "success",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      msg: "server error",
    });
  }
});

router.post("/phone-check/verify", async (req, res) => {
  const body = req.body;
  const code = body.code;
  const phone_number = body.phone_number;

  let phone_valid = false;
  console.log(code);

  try {
    const [result, field] = await pool.execute(
      `SELECT * FROM sms_validation WHERE phone_number = ?`,
      [phone_number]
    );
    const expire_time = new Date(result[0].expire).setHours(
      new Date(result[0].expire).getHours() + 9
    );
    console.log(result[0]);

    const now = Date.now();

    if (code === result[0].code && expire_time > now) {
      phone_valid = true;
    }

    res.send({
      phone_valid: phone_valid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      msg: "server error",
    });
  }
});

// 아이디 중복 확인
router.get("/is_id_dup", async (req, res) => {
  let user_id = req.query.user_id;
  try {
    const [is_id_dup] = await pool.execute(
      `SELECT user_id from user where user_id = ?`,
      [user_id]
    );

    if (is_id_dup[0] != undefined) {
      // user_id가 존재하면 중복되는 아이디 존재
      resultCode = 401;
      message = "사용할 수 없는 아이디입니다.";
    } else {
      resultCode = 200;
      message = "사용 가능한 아이디입니다.";
    }

    return res.json({
      code: resultCode,
      message: message,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      msg: "server error",
    });
  }
});

module.exports = router;

const pool = require("../db");
const express = require("express");
const router = express.Router();

// logout
router.get("/logout", async (req, res) => {
  let resultCode = 404;
  let message = "에러가 발생했습니다";

  try {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    resultCode = 200;
    message = "로그아웃에 성공하였습니다";

    return res.json({
      code: resultCode,
      message: message,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

module.exports = router;

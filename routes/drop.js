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
      //투표 기록
      //작품 평가하기(맘에 들어요/별로예요)기록
      //찜하기 기록
      //빼고 모두 다 삭제
      await pool.execute(`DELETE FROM blind_review WHERE user_id = ?`, [user_id]);
      let [character_review_id] = await pool.execute(`SELECT review_id FROM character_review WHERE user_id = ?`, [user_id]);
      console.log(user_id+" 탈퇴");
      for(let char of character_review_id){
        await pool.execute(`DELETE FROM review_comment WHERE review_id = ?`, [char.review_id]);
      }
      await pool.execute(`DELETE FROM character_review WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM comment_like WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM review_like WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM report_user WHERE user_id = ?`, [user_id]);
      await pool.execute(`DELETE FROM review_comment WHERE user_id = ?`, [user_id]);
      await pool.execute(`UPDATE dimo_grade SET user_id = '알수없음' WHERE user_id = ?`, [user_id]);
      await pool.execute(`UPDATE dimo_like SET user_id = '알수없음' WHERE user_id = ?`, [user_id]);
      await pool.execute(`UPDATE anime_character_vote SET user_id = '알수없음' WHERE user_id = ?`, [user_id]);

      const [reason] = await pool.execute(
        `INSERT INTO drop_reason (drop_reason) VALUES(?)`,
        [drop_reason]
      );

      const [drop_user] = await pool.execute(
        `UPDATE user SET user_id=?, password=null, name='알수없음', agency=null, phone_number=null, refresh_token=null, intro=null, profile_img=null, nickname=? WHERE user_id = ?`,
        ['알수없음'+reason.insertId, '알수없음'+reason.insertId, user_id]
      );
    
      console.log(reason.insertId);

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

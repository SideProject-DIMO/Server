const pool = require("../db");
const puppeteer = require("puppeteer");
const express = require("express");
const router = express.Router();

router.post("/like", async (req, res, next) => {
  const {user_id, content_type, contentId} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    const [like] = await pool.execute(
      `INSERT INTO dimo_like (content_type, content_id, user_id) VALUES (?, ?, ?)`,
      [content_type, contentId, user_id]
    );
    result_code = 200;
    message = "좋아요를 눌렀습니다.";
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

router.post("/dislike", async (req, res, next) => {
  const {user_id, content_type, contentId} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    const [dislike] = await pool.execute(
      `DELETE FROM dimo_like WHERE user_id = ? and content_type = ? and content_id = ?`,
      [user_id, content_type, contentId]
    );
    result_code = 200;
    message = "좋아요를 취소했습니다.";
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

// 평점 누르기
router.post("/grade", async (req, res, next) => {
  const {user_id, contentId, content_type, grade} = req.body;
  let result_code = 400;
  let message = "평점을 저장하는데 에러가 발생했습니다.";
  let grade_result_code = 400;
  let grade_message = "평점 평균을 저장하는데 에러가 발생했습니다.";

  try {
    const [my_mbti] = await pool.execute(
      `SELECT mbti FROM user WHERE user_id = ?`,
      [user_id]
    );

    const [is_grade_dup] = await pool.execute(
      `SELECT * FROM dimo_grade WHERE user_id = ? and content_id =? and content_type =?`,
      [user_id, contentId, content_type]
    );

    if (is_grade_dup[0] == null) {
      const [post_grade] = await pool.execute(
        `INSERT INTO dimo_grade (grade, user_id, content_id, content_type) VALUES (?, ?, ?, ?)`,
        [grade, user_id, contentId, content_type]
      );
      result_code = 200;
      message = "평점을 저장했습니다.";
    } else {
      const [mod_grade] = await pool.execute(
        `UPDATE dimo_grade SET grade =? WHERE user_id = ? and content_id = ? and content_type = ?`,
        [grade, user_id, contentId, content_type]
      );
      result_code = 201;
      message = "평점을 수정했습니다.";
    }

    let [is_exist_grade] = await pool.execute(
      `SELECT * FROM dimo_grade_avg WHERE content_id = ? and content_type = ? and mbti = ?`,
      [contentId, content_type, my_mbti[0].mbti]
    );

      if (is_exist_grade[0] != null) {
        await pool.execute(
        `UPDATE dimo_grade_avg SET mbti_grade_avg = ? and avg_people = ? WHERE content_id = ? and content_type = ? and mbti = ?`,
          [
          is_exist_grade[0].mbti_grade_avg + grade,
            is_exist_grade[0].avg_people + 1,
            contentId,
            content_type,
            my_mbti[0].mbti,
          ]
        );
        grade_message = "평점 평균을 업데이트 했습니다.";
      } else {
        await pool.execute(
        `INSERT INTO dimo_grade_avg (content_id, mbti, mbti_grade_avg, avg_people, content_type) VALUES (?, ?, ?, ?, ?)`,
        [conetentId, my_mbti[0].mbti, grade, 1, content_type]
        );
        grade_message = "평점 평균을 추가했습니다.";
      }
      grade_result_code = 200;

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      content_type: content_type,
      conetentId: contentId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// mbti별 평점 TOP3 조회하기
router.get("/mbti_grade", async (req, res, next) => {
  const {contentId, content_type} = req.query;
  try {
    const [mbti_grade] = await pool.execute(
      `SELECT * FROM dimo_grade_avg WHERE content_id = ? and content_type = ? ORDER BY entj DESC, intj DESC, estj DESC, istj DESC, enfj DESC, infj DESC, esfj DESC, isfj DESC, entp DESC, intp DESC, estp DESC, istp DESC, esfp DESC, isfp DESC, enfp DESC, infp DESC LIMIT 3`,
      [contentId, content_type]
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 상세 조회
router.get("/animedata/:contentId", async (req, res, next) => {
  const contentId = req.params.contentId;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    let [detail] = await pool.execute(
      `SELECT * FROM anime_contents WHERE anime_id = ?`,
      [contentId]
    );

    let [character_detail] = await pool.execute(
      `SELECT character_id, character_name, character_img, character_mbti from anime_character WHERE anime_id = ?`,
      [contentId]
    );

    result_code = 200;
    message = contentId + "번 애니메이션 조회에 성공했습니다.";
    return res.json({
      code: result_code,
      message: message,
      conetentId: contentId,
      title: detail[0].title,
      genre: detail[0].genre,
      plot: detail[0].plot,
      poster_img: detail[0].poster_img,
      director: detail[0].director,
      release: detail[0].release,
      rate: detail[0].rate,
      characters: character_detail,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

module.exports = router;

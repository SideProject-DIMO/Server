const pool = require("../db");
const puppeteer = require("puppeteer");
const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

//찜하기
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

//찜하기 취소
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

//찜 상태 확인
router.get("/is_like", async (req, res, next) => {
  const {user_id, content_type, contentId} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    const [is_like] = await pool.execute(
      `SELECT * FROM dimo_like WHERE user_id = ? and content_type = ? and content_id = ?`,
      [user_id, content_type, contentId]
    );

    if (is_like[0] != null) {
      result_code = 200;
      message = "좋아요를 누른 콘텐츠입니다.";
    } else {
      result_code = 201;
      message = "좋아요를 누르지 않은 콘텐츠입니다.";
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

//가장 찜 많이 한 mbti 보이기
router.get("/most_like", async (req, res, next) => {
  const {user_id, content_type, contentId} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let [most_mbti] = await pool.execute(
      `SELECT mbti, COUNT(*) AS count FROM dimo_like JOIN user ON dimo_like.user_id = user.user_id WHERE content_id = ? GROUP BY mbti ORDER BY count DESC LIMIT 1`,
      [contentId]
    );

    result_code = 200;
    message = "가장 찜을 많이 누른 mbti를 조회했습니다.";

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      most_mbti: most_mbti[0].mbti,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 평가하기
router.post("/grade", async (req, res, next) => {
  const {user_id, contentId, content_type, grade} = req.body;
  let result_code = 400;
  let message = "에러가 발생했습니다.";

  //grade 안되어있을 때에는 0, 평가가 안좋다면 -1, 좋다면 1
  try {
    let [is_exist] = await pool.execute(
      `SELECT * FROM dimo_grade WHERE user_id = ? and content_id = ? and content_type = ?`,
      [user_id, contentId, content_type]
    );

    let [mbti] = await pool.execute(
      `SELECT mbti FROM user WHERE user_id = ? `,
      [user_id]
    );

    if (is_exist[0] == null) {
      await pool.execute(
        `INSERT INTO dimo_grade(user_id, content_id, content_type, grade, user_mbti) VALUES (?, ?, ?, ?, ?)`,
        [user_id, contentId, content_type, grade, mbti[0].mbti]
      );
      result_code = 200;
      message = "평가를 저장했습니다.";
    } else {
      await pool.execute(
        `UPDATE dimo_grade SET grade = ? WHERE user_id = ? and content_id = ? and content_type = ?`,
        [grade, user_id, contentId, content_type]
      );
      result_code = 200;
      message = "평가를 수정했습니다.";
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

// 평가한 상태 조회하기
router.get("/is_grade", async (req, res, next) => {
  const {user_id, content_type, contentId} = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let [is_grade] = await pool.execute(
      `SELECT * FROM dimo_grade WHERE user_id = ? and content_type = ? and content_id = ? `,
      [user_id, content_type, contentId]
    );

    if (is_grade[0] == null) {
      is_grade[0] = null;
    }

    result_code = 200;
    message = "평가가 되었는지 조회했습니다.";

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      is_grade: is_grade[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 평가하기 가장 좋아한 MBTI와 가장 좋아하지 않는 MBTI 보이기
router.get("/mbti_result", async (req, res, next) => {
  const {contentId, content_type} = req.query;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    let [grade_best] = await pool.execute(
      `SELECT user_mbti, COUNT(*) AS count FROM dimo_grade WHERE content_id = ? and content_type = ? and grade = 1 GROUP BY user_mbti ORDER BY count DESC LIMIT 1`,
      [contentId, content_type]
    );

    let [grade_worst] = await pool.execute(
      `SELECT user_mbti, COUNT(*) AS count FROM dimo_grade WHERE content_id = ? and content_type = ? and grade = -1 GROUP BY user_mbti ORDER BY count DESC LIMIT 1`,
      [contentId, content_type]
    );

    if (grade_best[0] == null) {
      grade_best = "존재하지 않음";
      result_code = 201;
      message = "가장 좋아한 MBTI는 존재하지 않고,";
    } else {
      grade_best = grade_best[0].user_mbti;
      result_code = 200;
      message = "가장 좋아한 MBTI는 " + grade_best + "이고 ";
    }

    if (grade_worst[0] == null) {
      grade_worst = "존재하지 않음";
      result_code += 1;
      message += "가장 안좋아한 MBTI는 존재하지 않습니다.";
    } else {
      grade_worst = grade_worst[0].user_mbti;
      message += "가장 안좋아한 MBTI는 " + grade_worst + "입니다 ";
    }

    return res.json({
      code: result_code, //가장 좋아한 mbti와 좋아하지 않는 mbti가 모두 없다면 202, 한 쪽만 있다면 201, 둘 다 있다면 200
      message: message,
      grade_best: grade_best,
      grade_worst: grade_worst,
      content_type: content_type,
      contentId: contentId,
    });
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

    await pool.execute(
      `UPDATE anime_contents SET hits = hits + 1 WHERE anime_id = ?`,
      [contentId]
    );

    result_code = 200;
    message = contentId + "번 애니메이션 조회에 성공했습니다.";
    return res.json({
      code: result_code,
      message: message,
      contentId: contentId,
      title: detail[0].title,
      genre: detail[0].genre,
      plot: detail[0].plot,
      poster_img: detail[0].poster_img,
      director: detail[0].director,
      release: detail[0].anime_release,
      rate: detail[0].rate,
      characters: character_detail,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

router.get("/moviedata/:movie_id", async (req, res) => {
  try {
    // 영화 ID
    const movie_id = req.params.movie_id; // 요청 쿼리 파라미터로부터 영화 ID 받기

    // TMDB API 요청 URL
    const apiUrl = `https://api.themoviedb.org/3`;

    // 영화 정보를 가져오는 함수
    async function getMovieInfo(id) {
      try {
        // 영화 상세 정보 요청
        const response = await axios.get(`${apiUrl}/movie/${id}?language=ko`, {
          params: {
            api_key: process.env.api_key,
          },
        });

        // 감독 및 캐릭터 정보 요청
        const creditsResponse = await axios.get(
          `${apiUrl}/movie/${id}/credits?language=ko`,
          {
            params: {
              api_key: process.env.api_key,
            },
          }
        );

        // 영화 정보
        const movie_info = response.data;
        const title = movie_info.title;
        const plot = movie_info.overview;
        const release_date = movie_info.release_date;
        const genres = movie_info.genres;
        const runtime = movie_info.runtime;
        const poster_img = movie_info.poster_path;
        const movie_id = movie_info.id;

        // 감독
        const director = creditsResponse.data.crew.find(
          (person) => person.job === "Director"
        );

        // 캐릭터 정보
        const characters = creditsResponse.data.cast.slice(0, 15); // 상위 15명의 캐릭터 정보만

        // 영화 정보 return
        return {
          title,
          plot,
          release_date,
          genres,
          runtime,
          poster_img,
          movie_id,
          director: director.name,
          characters: characters.map((character) => ({
            profile_img: character.profile_path,
            character_name: character.character,
          })),
        };
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // 영화 정보 가져오기
    // const movie_info = await getMovieInfo(movie_id);

    res.json(await getMovieInfo(movie_id));
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;

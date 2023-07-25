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

//좋아요 상태 확인
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

// // 평점 누르기
// router.post("/grade", async (req, res, next) => {
//   const {user_id, contentId, content_type, grade} = req.body;
//   let result_code = 400;
//   let message = "평점을 저장하는데 에러가 발생했습니다.";
//   let grade_result_code = 400;
//   let grade_message = "평점 평균을 저장하는데 에러가 발생했습니다.";

//   try {
//     // 내 mbti
//     const [my_mbti] = await pool.execute(
//       `SELECT mbti FROM user WHERE user_id = ?`,
//       [user_id]
//     );

//     // 평점을 누른 적이 있는지
//     const [is_grade_dup] = await pool.execute(
//       `SELECT * FROM dimo_grade WHERE user_id = ? and content_id =? and content_type =?`,
//       [user_id, contentId, content_type]
//     );

//     // 내 mbti에 해당하는 평점 평균이 존재하는지
//     let [is_exist_grade] = await pool.execute(
//       `SELECT * FROM dimo_grade_avg WHERE content_id = ? and content_type = ? and mbti = ?`,
//       [contentId, content_type, my_mbti[0].mbti]
//     );

//     // 내가 평점을 누른 적이 없다면
//     if (is_grade_dup[0] == null) {
//       // 평점 저장
//       const [post_grade] = await pool.execute(
//         `INSERT INTO dimo_grade (grade, user_id, content_id, content_type) VALUES (?, ?, ?, ?)`,
//         [grade, user_id, contentId, content_type]
//       );
//       result_code = 200;
//       message = "평점을 저장했습니다.";

//       // 나와 동일한 mbti인 사람이 이미 해당 콘텐츠에 대해 평점을 누른 적이 있다면
//       if (is_exist_grade[0] != null) {
//         await pool.execute(
//           `UPDATE dimo_grade_avg SET mbti_grade_avg = ? and avg_people = ? and mbti_grade_sum = ? WHERE content_id = ? and content_type = ? and mbti = ?`,
//           [
//             (is_exist_grade[0].mbti_grade_sum + grade) /
//               (is_exist_grade[0].avg_people + 1),
//             is_exist_grade[0].avg_people + 1,
//             is_exist_grade[0].mbti_grade_sum + grade,
//             contentId,
//             content_type,
//             my_mbti[0].mbti,
//           ]
//         );
//         grade_message = "평점 평균을 업데이트 했습니다.";

//         // 나와 동일한 mbti인 사람이 한 번도 콘텐츠에 대해 평점을 누른 적이 없다면
//       } else {
//         await pool.execute(
//           `INSERT INTO dimo_grade_avg (content_id, mbti, mbti_grade_avg, mbti_grade_sum, avg_people, content_type) VALUES (?, ?, ?, ?, ?, ?)`,
//           [contentId, my_mbti[0].mbti, grade, grade, 1, content_type]
//         );
//         grade_message = "평점 평균을 추가했습니다.";
//       }
//       grade_result_code = 200;

//       // 내가 평점을 누른 적이 있다면
//     } else {
//       let last_grade = parseFloat(is_grade_dup[0].grade); // 이전 평점
//       let now_grade_sum =
//         parseFloat(is_exist_grade[0].mbti_grade_sum) - last_grade + grade; // 현재 평점 총합
//       let now_grade_avg =
//         (is_exist_grade[0].mbti_grade_sum - last_grade + grade) /
//         is_exist_grade[0].avg_people;

//       console.log(now_grade_avg);
//       console.log(now_grade_sum);

//       // 전에 있던 평점에서 업데이트
//       const [mod_grade] = await pool.execute(
//         `UPDATE dimo_grade SET grade =? WHERE user_id = ? and content_id = ? and content_type = ?`,
//         [grade, user_id, contentId, content_type]
//       );
//       result_code = 201;
//       message = "평점을 수정했습니다.";

//       // 내가 이미 평점을 눌러 내 mbti는 평점 평균이 존재하므로 사람 수는 변화 없이 평점 총합에서 이전 평점을 빼고 새롭게 변동한 평점을 더해서 저장
//       await pool.execute(
//         `UPDATE dimo_grade_avg SET mbti_grade_avg = ? and mbti_grade_sum = ? WHERE content_id = ? and content_type = ? and mbti = ?`,
//         [now_grade_avg, now_grade_sum, contentId, content_type, my_mbti[0].mbti]
//       );
//       grade_message = "평점 평균을 수정했습니다.";
//       grade_result_code = 201;
//     }

//     return res.json({
//       code: result_code,
//       message: message,
//       grade_result_code: grade_result_code,
//       grade_message: grade_message,
//       user_id: user_id,
//       content_type: content_type,
//       conetentId: contentId,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json(err);
//   }
// });

// mbti별 평점 TOP3 조회하기
router.get("/mbti_grade", async (req, res, next) => {
  const {contentId, content_type} = req.query;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    const [mbti_grade] = await pool.execute(
      `SELECT * FROM dimo_grade_avg WHERE content_id = ? and content_type = ? ORDER BY mbti_grade_avg DESC LIMIT 3`,
      [contentId, content_type]
    );

    result_code = 200;
    message = "TOP3 mbti 평점을 성공적으로 조회했습니다.";

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      mbti_grade: mbti_grade,
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

router.get("/moviedata/:movieId", async (req, res) => {
  try {
    // 영화 ID
    const movieId = req.query.movieId; // 요청 쿼리 파라미터로부터 영화 ID 받기

    // TMDB API 키
    const apiKey = "9e43a6867c994baa79d59e3d65755b86";

    // TMDB API 요청 URL
    const apiUrl = `https://api.themoviedb.org/3`;

    // 영화 정보를 가져오는 함수
    async function getMovieInfo(movieId) {
      try {
        // 영화 상세 정보 요청
        const response = await axios.get(
          `${apiUrl}/movie/${movieId}?language=ko`,
          {
            params: {
              api_key: apiKey,
            },
          }
        );

        // 감독 및 캐릭터 정보 요청
        const creditsResponse = await axios.get(
          `${apiUrl}/movie/${movieId}/credits?language=ko`,
          {
            params: {
              api_key: apiKey,
            },
          }
        );

        // 영화 정보
        const movieInfo = response.data;
        const title = movieInfo.title;
        const plot = movieInfo.overview;
        const release_date = movieInfo.release_date;
        const genres = movieInfo.genres;
        const runtime = movieInfo.runtime;
        const posterImg = movieInfo.poster_path;
        const movieID = movieInfo.belongs_to_collection.id;

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
          posterImg,
          movieID,
          director: director.name,
          characters: characters.map((character) => ({
            profileImg: character.profile_path,
            characterName: character.character,
          })),
        };
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // 영화 정보 가져오기
    const movieInfo = await getMovieInfo(movieId);

    res.json(movieInfo);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

module.exports = router;

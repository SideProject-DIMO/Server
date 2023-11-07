const pool = require("../db");
const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

router.get("/anime", async (req, res, next) => {
  const user_id = req.query.user_id;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    let rand_num = [];

    for (let i = 0; i < 5; i++) {
      rand_num[i] = Math.floor(Math.random() * (100 - 1) + 1); //1~100까지 랜덤 선택
    }

    let [represent] = await pool.execute(
      `SELECT * FROM anime_contents WHERE id = ? or id = ? or id = ? or id = ? or id= ?`,
      [rand_num[0], rand_num[1], rand_num[2], rand_num[3], rand_num[4]]
    ); //랜덤 애니

    let [my_mbti] = await pool.execute(
      `SELECt mbti FROM user WHERE user_id = ?`,
      [user_id]
    );

    let [same_mbti_anime] = await pool.execute(
      `SELECT DISTINCT * FROM anime_contents WHERE anime_id IN (SELECT anime_id FROM anime_character WHERE character_mbti = ?) LIMIT 10`,
      [my_mbti[0].mbti]
    ); //같은 mbti의 주인공이 있는 애니

    let [same_mbti_char] = await pool.execute(
      `SELECT character_id, anime_contents.anime_id, character_img, character_name, character_mbti, title FROM anime_character JOIN anime_contents ON anime_character.anime_id = anime_contents.anime_id WHERE character_mbti = ? LIMIT 10`,
      [my_mbti[0].mbti]
    ); //같은 mbti인 캐릭터 모아보기

    let [recommend] = await pool.execute(
      `SELECT anime_id, title, genre, plot, poster_img, director, anime_release, rate, hits FROM anime_contents WHERE anime_id in (SELECT DISTINCT content_id FROM dimo_like WHERE user_id in (SELECT user_id FROM user WHERE mbti = ?)) LIMIT 10`,
      [my_mbti[0].mbti]
    ); //같은 mbti 사용자가 추천한 애니

    let [hit] = await pool.execute(
      `SELECT * FROM anime_contents ORDER BY hits DESC LIMIT 10`
    ); //조회수 순 정렬

    result_code = 200;
    message = "홈 화면 조회에 성공했습니다.";
    return res.json({
      code: result_code,
      message: message,
      contents: [
        {
          category: "represent",
          represent,
        },
        {
          category: "same_mbti_anime",
          same_mbti_anime,
        },
        {
          category: "same_mbti_character",
          same_mbti_char,
        },
        {
          category: "recommend",
          recommend,
        },
        {
          category: "hits",
          hit,
        },
      ],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

router.get("/anime_more", async (req, res, next) => {
  const {user_id, type} = req.query;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  let [content] = "";
  try {
    let [my_mbti] = await pool.execute(
      `SELECt mbti FROM user WHERE user_id = ?`,
      [user_id]
    );
  if(type == "same_mbti_anime") {
      [content] = await pool.execute(
        `SELECT DISTINCT * FROM anime_contents WHERE anime_id IN (SELECT anime_id FROM anime_character WHERE character_mbti = ?)`,
        [my_mbti[0].mbti]
      ); //같은 mbti의 주인공이 있는 애니
    }
    else if(type == "same_mbti_character") {
      [content] = await pool.execute(
        `SELECT character_id, anime_contents.anime_id, character_img, character_name, character_mbti, title FROM anime_character JOIN anime_contents ON anime_character.anime_id = anime_contents.anime_id WHERE character_mbti = ?`,
        [my_mbti[0].mbti]
      ); //같은 mbti인 캐릭터 모아보기
    }
    else if(type == "recommend") {
      [content] = await pool.execute(
        `SELECT anime_id, title, genre, plot, poster_img, director, anime_release, rate, hits FROM anime_contents WHERE anime_id in (SELECT DISTINCT content_id FROM dimo_like WHERE user_id in (SELECT user_id FROM user WHERE mbti = ?))`,
        [my_mbti[0].mbti]
      ); //같은 mbti 사용자가 추천한 애니
    }
    else {
      [content] = await pool.execute(
        `SELECT * FROM anime_contents ORDER BY hits DESC`
      ); //조회수 순 정렬
    }

    result_code = 200;
    message = "더보기 조회에 성공했습니다.";
    return res.json({
      code: result_code,
      message: message,
      contents: content,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

// router.get("/movie", async (req, res) => {
//   const user_id = req.query.user_id;

//   try {
//     let rand_num = [];
//     let movieI = [];

//     for (let i = 0; i < 5; i++) {
//       rand_num[i] = Math.floor(Math.random() * (100 - 1) + 1); //1~100까지 랜덤 선택
//     }

//     let [represent] = await pool.execute(
//       `SELECT * FROM movie_contents WHERE id = ? or id = ? or id = ? or id = ? or id= ?`,
//       [rand_num[0], rand_num[1], rand_num[2], rand_num[3], rand_num[4]]
//     ); //랜덤 콘텐츠
//     // const movie_id = req.query.movie_id; // 요청 쿼리 파라미터로부터 영화 ID 받기

//     // TMDB API 요청 URL
//     const apiUrl = `https://api.themoviedb.org/3`;

//     // 영화 정보를 가져오는 함수
//     // async function getRandInfo(represent) {
//     //   try {
//     for (let i of represent) {
//       console.log(i.id);
//       // 영화 상세 정보 요청
//       const response = await axios.get(`${apiUrl}/movie/${i.id}?language=ko`, {
//         params: {
//           api_key: process.env.api_key,
//         },
//       });

//       // 영화 정보
//       const movie_info = response.data;
//       const title = movie_info.title;
//       const poster_img = movie_info.poster_path;
//       const id = movie_info.id;
//       console.log(title);

//       // console.log(id);

//       // movieI.push([title, poster_img, id]); //이 부분 안됨
//       // console.log(movieI);

//       // // 영화 정보 return
//       // return {
//       //   title,
//       //   poster_img,
//       //   id,
//       // };
//       // }
//       // } catch (error) {
//       //   // console.error(error);
//       //   throw new Error(error.message);
//       // }
//     }

//     // movie_info = await getRandInfo(represent);
//     // console.log(movie_info);
//     // 영화 정보 랜덤으로 가져오기
//     // for (let i of represent) {
//     //   movie_info = await getRandInfo(i.id);
//     //   console.log(movie_info);
//     // }

//     // res.json(movieI);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       error: error.message,
//     });
//   }
// });

module.exports = router;

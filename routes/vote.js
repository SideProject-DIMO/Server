const pool = require("../db");
const express = require("express");
const router = express.Router();

router.post("/", async (req, res, next) => {
  //투표하기
  const {user_id, content_id, character_id, ei, sn, tf, jp} = req.body;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    let [is_vote] = await pool.execute(
      `SELECT * FROM anime_character_vote WHERE user_id = ? and character_id = ?`,
      [user_id, character_id]
    );

    if (is_vote[0] == null) {
      let [my_mbti] = await pool.execute(
        `SELECT mbti FROM user WHERE user_id = ?`,
        [user_id]
      );

      await pool.execute(
        `INSERT INTO anime_character_vote(character_id, user_mbti, user_id, energy, recognization, prediction, reaction, content_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [character_id, my_mbti[0].mbti, user_id, ei, sn, tf, jp, content_id]
      );

      [first] = await pool.execute(
        `SELECT energy, COUNT(*) AS count
                  FROM anime_character_vote
                  WHERE energy IN ('E', 'I') and character_id = ?
                  GROUP BY energy
                  ORDER BY count DESC
                  LIMIT 1`,
        [character_id]
      );
      [second] = await pool.execute(
        `SELECT recognization, COUNT(*) AS count
                  FROM anime_character_vote
                  WHERE recognization IN ('S', 'N') and character_id = ?
                  GROUP BY recognization
                  ORDER BY count DESC
                  LIMIT 1`,
        [character_id]
      );
      [third] = await pool.execute(
        `SELECT prediction, COUNT(*) AS count
                  FROM anime_character_vote
                  WHERE prediction IN ('T', 'F') and character_id = ?
                  GROUP BY prediction
                  ORDER BY count DESC
                  LIMIT 1`,
        [character_id]
      );
      [fourth] = await pool.execute(
        `SELECT reaction, COUNT(*) AS count
                  FROM anime_character_vote
                  WHERE reaction IN ('J', 'P') and character_id = ?
                  GROUP BY reaction
                  ORDER BY count DESC
                  LIMIT 1`,
        [character_id]
      );

      character_mbti =
        first[0].energy +
        second[0].recognization +
        third[0].prediction +
        fourth[0].reaction;

      result_code = 200;
      message = "투표를 완료하였습니다.";

      await pool.execute(
        `UPDATE anime_character SET character_mbti =  ? WHERE character_id = ?`,
        [character_mbti, character_id]
      );

      let [count] = await pool.execute(
        `SELECT COUNT(*) AS count FROM anime_character_vote WHERE character_id = ?`,
        [character_id]
      );

      let [title] = await pool.execute(
        `SELECT title FROM anime_contents WHERE anime_id = ?`,
        [content_id]
      );

      mbti = {
        ei: Math.round((first[0].count / count[0].count) * 100),
        sn: Math.round((second[0].count / count[0].count) * 100),
        tf: Math.round((third[0].count / count[0].count) * 100),
        jp: Math.round((fourth[0].count / count[0].count) * 100),
      };

      return res.json({
        code: result_code,
        message: message,
        contentId: content_id,
        content_title: title[0].title,
        character_id: character_id,
        character_mbti: character_mbti,
        mbti_percent: mbti,
      });
    } else {
      result_code = 400;
      message = "이미 투표한 캐릭터입니다.";

      return res.json({
        code: result_code,
        message: message,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.get("/recommend", async (req, res, next) => {
  const {user_id, category} = req.query;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  let random_sorted_arr;
  try {
    function getRandomInt(max) {
      return Math.floor(Math.random() * max);
    }

    function randomSort(arr) {
      // 랜덤 숫자를 이용하여 배열 요소를 무작위로 재배치
      for (let i = arr.length - 1; i > 0; i--) {
        const j = getRandomInt(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }

      return arr;
    }

    if (category == "rand") {
      //랜덤순
      [rand_char] = await pool.execute(`SELECT * FROM anime_character`);
      random_sorted_arr = randomSort(rand_char);

      result_code = 200;
      message = "캐릭터 랜덤 추천 성공";
    } else {
      //인기순
      [pop_char] = await pool.execute(
        `SELECT DISTINCT anime_character_vote.character_id, content_id, character_name, character_img FROM anime_character_vote JOIN anime_character ON anime_character.character_id = anime_character_vote.character_id ORDER BY anime_character_vote.character_id DESC;`
      );

      result_code = 200;
      message = "캐릭터 인기순 추천 성공";
    }

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_info: category == "rand" ? random_sorted_arr : pop_char,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.get("/search", async (req, res, next) => {
  //검색
  let {user_id, search_content} = req.query;
  let result_code = 400;
  let message = "에러가 발생했습니다.";
  try {
    search_content = "%" + search_content + "%";
    let [search_res] = await pool.execute(
      `SELECT * FROM anime_character WHERE character_name LIKE ?`,
      [search_content]
    );

    result_code = 200;
    message = "캐릭터 검색 성공";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      result: search_res,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

module.exports = router;

const pool = require("../db");
const express = require("express");
const router = express.Router();

router.post("/save_chr_list", async (req, res, next) => {
  //최근 본 캐릭터 저장하기
  let { user_id, character_id } = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(`INSERT INTO recent_chr_list(user_id, character_id) VALUES(?, ?)`, [
        user_id,
        character_id
      ]);

    let [search_count] = await pool.execute(`SELECT COUNT(*) AS count FROM recent_chr_list WHERE user_id = ?`, [user_id]);
    if (search_count[0].count >= 6) {
        await pool.execute(
          `DELETE recent_chr_list
          FROM recent_chr_list
          JOIN (
              SELECT MIN(recent_chr_list_id) AS min_search_id
              FROM recent_chr_list
          ) AS min_search
          ON recent_chr_list.recent_chr_list_id = min_search.min_search_id`);
    } 

    result_code = 200;
    message = "최근 본 캐릭터를 저장했습니다.";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.post("/", async (req, res, next) => {
  //투표하기
  const { user_id, contentId, character_id, ei, sn, tf, jp } = req.body;
  let result_code = 404;
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
        `INSERT INTO anime_character_vote(character_id, user_mbti, user_id, energy, recognization, prediction, reaction, content_id, vote_mbti) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          character_id,
          my_mbti[0].mbti,
          user_id,
          ei,
          sn,
          tf,
          jp,
          contentId,
          ei + sn + tf + jp,
        ]
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
        [contentId]
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
        contentId: contentId,
        content_title: title[0].title,
        character_id: character_id,
        character_mbti: character_mbti,
        mbti_percent: mbti,
      });
    } else {
      result_code = 404;
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

router.get("/", async (req, res, next) => {
  //투표 결과 조회하기
  const { user_id, character_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let [content_info] = "";
    let [same_choose] = "";
    let [is_vote] = await pool.execute(
      `SELECT * FROM anime_character_vote WHERE user_id = ? and character_id = ?`,
      [user_id, character_id]
    );
    [content_info] = await pool.execute(
      `SELECT title, character_img, character_name, character_mbti FROM anime_character JOIN anime_contents ON anime_contents.anime_id = anime_character.anime_id WHERE character_id = ? `,
      [character_id]
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

    let [count] = await pool.execute(
      `SELECT COUNT(*) AS count FROM anime_character_vote WHERE character_id = ?`,
      [character_id]
    );

    mbti = [
      {
        mbti: first[0].energy,
        ei: Math.round((first[0].count / count[0].count) * 100),
      },
      {
        mbti: second[0].recognization,
        sn: Math.round((second[0].count / count[0].count) * 100),
      },
      {
        mbti: third[0].prediction,
        tf: Math.round((third[0].count / count[0].count) * 100),
      },
      {
        mbti: fourth[0].reaction,
        jp: Math.round((fourth[0].count / count[0].count) * 100),
      },
    ];

    if (is_vote[0] != null) {
      //나랑 동일한 mbti 고른 사람 비율
      [same_choose] = await pool.execute(
        `SELECT COUNT(*) AS count FROM anime_character_vote WHERE energy = ? and recognization = ? and prediction = ? and reaction = ? and character_id = ?`,
        [
          is_vote[0].energy,
          is_vote[0].recognization,
          is_vote[0].prediction,
          is_vote[0].reaction,
          character_id,
        ]
      );

      percent = Math.round((same_choose[0].count / count[0].count) * 100);
      my_vote_mbti =
        is_vote[0].energy +
        is_vote[0].recognization +
        is_vote[0].prediction +
        is_vote[0].reaction;

      result_code = 200;
      message = "나를 비롯한 투표 결과를 조회했습니다.";

      return res.json({
        code: result_code,
        message: message,
        content_info: content_info[0],
        character_id: character_id,
        mbti_percent: mbti,
        same_vote_percent: percent,
        my_vote_mbti: my_vote_mbti,
      });
    } else {
      result_code = 201;
      message = "사람들의 투표 결과를 조회했습니다.";

      let [most_vote_mbti] = await pool.execute(
        `SELECT vote_mbti FROM anime_character_vote WHERE character_id = ?`,
        [character_id]
      );

      return res.json({
        code: result_code,
        message: message,
        content_info: content_info[0],
        character_id: character_id,
        mbti_percent: mbti,
        most_vote_mbti: most_vote_mbti[0].vote_mbti,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.get("/view_revote", async (req, res, next) => {
  //재투표 시, 기존 투표한 속성 조회
  let { user_id, character_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";

  try {
    let [my_vote_result] = await pool.execute(
      `SELECT energy, recognization, prediction, reaction FROM anime_character_vote WHERE character_id = ? and user_id = ?`,
      [character_id, user_id]
    );

    result_code = 200;
    message = "내가 투표했던 속성 정보를 표시합니다.";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_id: character_id,
      my_vote_result: my_vote_result[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.post("/revote", async (req, res, next) => {
  //재투표하기
  const { user_id, contentId, character_id, ei, sn, tf, jp } = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `UPDATE anime_character_vote SET energy = ?, recognization = ?, prediction = ?, reaction = ?, vote_mbti = ? WHERE character_id = ? and user_id = ?`,
      [ei, sn, tf, jp, ei + sn + tf + jp, character_id, user_id]
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
    message = "재투표를 완료하였습니다.";

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
      [contentId]
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
      contentId: contentId,
      content_title: title[0].title,
      character_id: character_id,
      character_mbti: character_mbti,
      mbti_percent: mbti,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.get("/recommend", async (req, res, next) => {
  const { user_id, category } = req.query;
  let result_code = 404;
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
      [rand_char] = await pool.execute(
        `SELECT character_id, anime_character.anime_id, character_name, character_img, character_mbti, title FROM anime_character JOIN anime_contents ON anime_character.anime_id = anime_contents.anime_id ORDER BY rand() LIMIT 300`
      );
      // random_sorted_arr = randomSort(rand_char);
      for (let rand of rand_char) {
        let [is_vote] = await pool.execute(
          `SELECT * FROM anime_character_vote WHERE character_id = ? and user_id = ?`,
          [rand.character_id, user_id]
        );
        if (is_vote[0] == null) {
          rand.is_vote = 0;
        } else {
          rand.is_vote = 1;
        }
      }

      result_code = 200;
      message = "캐릭터 랜덤 추천 성공";
    } else {
      //인기순
      [pop_char] = await pool.execute(
        `SELECT 
        anime_character_vote.character_id, 
        anime_contents.anime_id, 
        anime_character.character_name, 
        anime_character.character_img, 
        anime_character.character_mbti, 
        anime_contents.title, 
        COUNT(*) AS count 
    FROM 
        anime_character_vote 
    JOIN 
        anime_character ON anime_character.character_id = anime_character_vote.character_id 
    JOIN 
        anime_contents ON anime_contents.anime_id = anime_character.anime_id 
    GROUP BY 
        anime_character_vote.character_id, 
        anime_contents.anime_id, 
        anime_character.character_name, 
        anime_character.character_img, 
        anime_character.character_mbti, 
        anime_contents.title 
    ORDER BY 
        count DESC;`
      );

      for (let pop of pop_char) {
        let [is_vote] = await pool.execute(
          `SELECT * FROM anime_character_vote WHERE character_id = ? and user_id = ?`,
          [pop.character_id, user_id]
        );
        if (is_vote[0] == null) {
          pop.is_vote = 0;
        } else {
          pop.is_vote = 1;
        }
      }

      result_code = 200;
      message = "캐릭터 인기순 추천 성공";
    }

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      character_info: category == "rand" ? rand_char : pop_char,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.get("/search_character", async (req, res, next) => {
  //캐릭터 검색하기
  let { user_id, search_content } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    search_content = "%" + search_content + "%";
    let [search_res] = await pool.execute(
      `SELECT character_id, anime_character.anime_id, character_img, character_name, character_mbti, title FROM anime_character JOIN anime_contents ON anime_contents.anime_id = anime_character.anime_id WHERE character_name LIKE ?`,
      [search_content]
    );

    if (search_res[0] == null) {
      result_code = 201;
      message = "검색 결과가 없음";
      return res.json({
        code: result_code,
        message: message,
        user_id: user_id,
        result: search_res,
      });
    }

    for (let res of search_res) {
      let [is_vote] = await pool.execute(
        `SELECT * FROM anime_character_vote WHERE user_id = ? and character_id = ?`,
        [user_id, res.character_id]
      );
      if (is_vote[0] != null) {
        res.is_vote = 1;
      } else {
        res.is_vote = 0;
      }
      //여기는 다 anime니까
      res.category = "anime";
    }

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


router.get("/view_save_search", async (req, res, next) => {
  //저장한 검색어 띄우기
  let { user_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let search_list;
    let [exist] = await pool.execute(
      `SELECT * FROM search_list WHERE user_id = ?`,
      [user_id]
    );
    if(exist[0] == null){
      search_list = null;
    }
    else{
      search_list = exist;
    }

    result_code = 200;
    message = "최근 검색한 검색어를 조회했습니다.";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      search_list : search_list
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.post("/save_search", async (req, res, next) => {
  //최근 검색어 저장하기
  let { user_id, search_content } = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(`INSERT INTO search_list(user_id, content) VALUES(?, ?)`, [
        user_id,
        search_content
      ]);

    let [search_count] = await pool.execute(`SELECT COUNT(*) AS count FROM search_list WHERE user_id = ?`, [user_id]);
    if (search_count[0].count >= 6) {
        await pool.execute(
          `DELETE search_list
          FROM search_list
          JOIN (
              SELECT MIN(search_id) AS min_search_id
              FROM search_list
          ) AS min_search
          ON search_list.search_id = min_search.min_search_id`);
    } 
    
    [exist] = await pool.execute(
      `SELECT * FROM search_list WHERE user_id = ?`,
      [user_id]
    );

    result_code = 200;
    message = "최근 검색어를 저장했습니다.";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      search_list : exist
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.delete("/delete_search", async (req, res, next) => {
  //최근 검색어 한 개 삭제하기
  const {user_id, search_content} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
      await pool.execute(
        `DELETE FROM search_list WHERE user_id = ? and content = ?`,
        [user_id, search_content]
      );

    result_code = 200;
    message = "최근 검색어 한 개를 삭제했습니다.";

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.delete("/delete_all_search", async (req, res, next) => {
  //최근 검색어 전부 삭제하기
  const {user_id} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `DELETE FROM search_list WHERE user_id = ?`,
      [user_id]
    );
    
    result_code = 200;
    message = "최근 검색어를 모두 삭제했습니다.";

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.get("/view_recent_seen_chr", async (req, res, next) => {
  //최근 본 캐릭터 조회하기
  let { user_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let seen_chr_list;
    let [exist] = await pool.execute(
      `SELECT * FROM recent_chr_list WHERE user_id = ?`,
      [user_id]
    );
    if(exist[0] == null){
      seen_chr_list = null;
    }
    else{
      seen_chr_list = exist;
    }

    result_code = 200;
    message = "최근 본 캐릭터를 조회했습니다.";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      seen_chr_list : seen_chr_list
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.delete("/delete_seen_chr", async (req, res, next) => {
  //최근 본 캐릭터 한 개 삭제하기
  const {user_id, character_id} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
      await pool.execute(
        `DELETE FROM recent_chr_list WHERE user_id = ? and character_id = ?`,
        [user_id, character_id]
      );

    result_code = 200;
    message = "최근 본 캐릭터 한 개를 삭제했습니다.";

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.delete("/delete_all_seen_chr", async (req, res, next) => {
  //최근 본 캐릭터 전부 삭제하기
  const {user_id} = req.body;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    await pool.execute(
      `DELETE FROM recent_chr_list WHERE user_id = ?`,
      [user_id]
    );
    
    result_code = 200;
    message = "최근 본 캐릭터를 모두 삭제했습니다.";

    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.get("/search_content", async (req, res, next) => {
  //내용 검색하기
  let { user_id, search_content } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    search_content = "%" + search_content + "%";
    let [search_res] = await pool.execute(
      `SELECT character_id, anime_contents.anime_id, character_img, character_name, character_mbti, title FROM anime_contents JOIN anime_character ON anime_contents.anime_id = anime_character.anime_id WHERE title LIKE ?`,
      [search_content]
    );

    if (search_res[0] == null) {
      result_code = 201;
      message = "검색 결과가 없음";
      return res.json({
        code: result_code,
        message: message,
        user_id: user_id,
        result: search_res,
      });
    }

    for (let res of search_res) {
      let [is_vote] = await pool.execute(
        `SELECT * FROM anime_character_vote WHERE user_id = ? and character_id = ?`,
        [user_id, res.character_id]
      );
      if (is_vote[0] != null) {
        res.is_vote = 1;
      } else {
        res.is_vote = 0;
      }
      res.category = "anime";
    }

    result_code = 200;
    message = "작품명 검색 성공";
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

router.get("/view_result", async (req, res, next) => {
  //캐릭터 분석 확인하기
  let { user_id, character_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    let [is_vote] = await pool.execute(
      `SELECT * FROM anime_character_vote WHERE user_id = ? and character_id = ?`,
      [user_id, character_id]
    );

    let percent = 0;
    let my_vote_mbti = null;

    let [count] = await pool.execute(
      `SELECT COUNT(*) AS count FROM anime_character_vote WHERE character_id = ?`,
      [character_id]
    );

    if (is_vote[0] == null) {
      //나와 동일하게 투표한 사람 퍼센트 보내지 않기
      result_code = 201;
      message = "아직 투표하지 않은 캐릭터입니다.";
    } else {
      //나와 동일하게 투표한 사람 퍼센트 보내기
      let [same_choose] = await pool.execute(
        `SELECT COUNT(*) AS count FROM anime_character_vote WHERE energy = ? and recognization = ? and prediction = ? and reaction = ? and character_id = ?`,
        [
          is_vote[0].energy,
          is_vote[0].recognization,
          is_vote[0].prediction,
          is_vote[0].reaction,
          character_id,
        ]
      );

      percent = Math.round((same_choose[0].count / count[0].count) * 100);
      my_vote_mbti =
        is_vote[0].energy +
        is_vote[0].recognization +
        is_vote[0].prediction +
        is_vote[0].reaction;
      result_code = 200;
      message = "나랑 동일하게 투표한 사람 비율을 조회했습니다.";
    }

    //mbti top3 투표율 및 가장 많은 사람이 투표한 mbti
    let [top3] = await pool.execute(
      `SELECT vote_mbti, COUNT(*) AS count
                FROM anime_character_vote
                WHERE character_id = ?
                GROUP BY vote_mbti
                ORDER BY count DESC
                LIMIT 3`,
      [character_id]
    );

    let [info] = await pool.execute(
      `SELECT anime_character.anime_id, title, anime_character.character_id, character_name, character_img, character_mbti FROM anime_character JOIN anime_contents ON anime_character.anime_id = anime_contents.anime_id WHERE anime_character.character_id = ?`,
      [character_id]
    );

    if (top3.length == 3) {
      first = top3[0].vote_mbti;
      second = top3[1].vote_mbti;
      third = top3[2].vote_mbti;
      top3_mbti = {
        first: {
          mbti: first,
          percent: Math.round((top3[0].count / count[0].count) * 100),
        },
        second: {
          mbti: second,
          percent: Math.round((top3[1].count / count[0].count) * 100),
        },
        third: {
          mbti: third,
          percent: Math.round((top3[2].count / count[0].count) * 100),
        },
      };
    } else if (top3.length == 2) {
      first = top3[0].vote_mbti;
      second = top3[1].vote_mbti;
      third = "결과가 없습니다.";
      top3_mbti = {
        first: {
          mbti: first,
          percent: Math.round((top3[0].count / count[0].count) * 100),
        },
        second: {
          mbti: second,
          percent: Math.round((top3[1].count / count[0].count) * 100),
        },
        third: {
          mbti: third,
          percent: 0,
        },
      };
    } else if (top3.length == 1) {
      first = top3[0].vote_mbti;
      second = "결과가 없습니다.";
      third = "결과가 없습니다.";
      top3_mbti = {
        first: {
          mbti: first,
          percent: Math.round((top3[0].count / count[0].count) * 100),
        },
        second: {
          mbti: second,
          percent: 0,
        },
        third: {
          mbti: third,
          percent: 0,
        },
      };
    } else {
      first = "결과가 없습니다.";
      second = "결과가 없습니다.";
      third = "결과가 없습니다.";
      top3_mbti = {
        first: {
          mbti: first,
          percent: 0,
        },
        second: {
          mbti: second,
          percent: 0,
        },
        third: {
          mbti: third,
          percent: 0,
        },
      };
    }
    return res.json({
      code: result_code,
      message: message,
      character_info: info[0],
      my_vote_mbti: my_vote_mbti,
      my_vote_mbti_percent: percent,
      top3_mbti: top3_mbti,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

router.get("/another_character", async (req, res, next) => {
  //같은 작품 속 다른 캐릭터 조회
  let { user_id, character_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";

  try {
    let [content] = await pool.execute(
      `SELECT anime_id FROM anime_character WHERE character_id = ?`,
      [character_id]
    );

    let [another_character] = await pool.execute(
      `SELECT character_id, anime_contents.anime_id, character_img, character_name, character_mbti, title FROM anime_character JOIN anime_contents ON anime_contents.anime_id = anime_character.anime_id WHERE anime_contents.anime_id = ?`,
      [content[0].anime_id]
    );

    for (let an of another_character) {
      let [is_vote] = await pool.execute(
        `SELECT * FROM anime_character_vote WHERE user_id = ? and character_id = ?`,
        [user_id, an.character_id]
      );

      if (is_vote[0] == null) {
        an.is_vote = 0;
      } else {
        an.is_vote = 1;
      }
    }

    result_code = 200;
    message = "같은 작품 내 다른 캐릭터 조회 성공";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      result: another_character,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(error);
  }
});

module.exports = router;

const pool = require("../db");
const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const admin = require('firebase-admin');
const database = require("../routes/firebase/config");
const fs = require('fs');
const { getStorage, getInstance, ref, deleteObject } = require('firebase-admin/storage');

const disk_storage = multer.diskStorage({
  // destination: (req, file, cb) => {
  //   cb(null, 'uploads/'); // 이미지가 서버에 업로드될 디렉토리
  // },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // 파일명 설정
  },
});
const upload = multer({ storage: disk_storage });

// 내 프로필 조회하기
router.get("/", async (req, res, next) => {
  const { user_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";

  try {
    const [my_profile] = await pool.execute(
      `SELECT name, nickname, mbti, intro, profile_img FROM user WHERE user_id = ?`,
      [user_id]
    );
    result_code = 200;
    message = "내 프로필 조회 성공";
    return res.json({
      code: result_code,
      message: message,
      user_id: user_id,
      name: my_profile[0].name,
      nickname: my_profile[0].nickname,
      mbti: my_profile[0].mbti,
      intro: my_profile[0].intro,
      profile_img: my_profile[0].profile_img,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 내 프로필 수정하기
router.post("/mod_profile", upload.single("image"), async (req, res, next) => {
  const { user_id, intro } = req.body;
  const imageFile = req.file;
  let result_code = 404;
  let message = "에러가 발생했습니다";
  try {
    let [is_exist] = await pool.execute(
      `SELECT profile_img, intro FROM user WHERE user_id = ?`, [user_id]);

    //프로필 이미지 수정x
    if (imageFile == null && intro != null) {
      await pool.execute(`UPDATE user SET intro = ? WHERE user_id = ?`, [
        intro,
        user_id,
      ]);
    } else if (intro == null && imageFile != null) {
      //인트로 수정x
      const bucket = admin.storage().bucket();
      const destination = "profile/" + user_id + "_" + imageFile.originalname;
      const file = bucket.file(destination);
      const stream = file.createWriteStream({
        metadata: {
          contentType: imageFile.mimetype,
        },
      });

      stream.on("error", (error) => {
        console.error(error);
      });

      fs.createReadStream(imageFile.path).pipe(stream);
      if(is_exist[0].profile_img != null){
        const desertRef = bucket.file(is_exist[0].profile_img && is_exist[0].profile_img != '');
        // Delete the file
        desertRef.delete();
      }

      await pool.execute(`UPDATE user SET profile_img = ? WHERE user_id = ?`, [
        destination,
        user_id,
      ]);

    } else {
      //둘 다 수정
      const bucket = admin.storage().bucket();
      const destination = "profile/" + user_id + "_" + imageFile.originalname;
      const file = bucket.file(destination);

      const stream = file.createWriteStream({
        metadata: {
          contentType: imageFile.mimetype,
        },
      });

      stream.on("error", (error) => {
        console.error(error);
      });

      fs.createReadStream(imageFile.path).pipe(stream);

      if(is_exist[0].profile_img != null && is_exist[0].profile_img != ''){
        const desertRef = bucket.file(is_exist[0].profile_img);
        // Delete the file
        desertRef.delete();
      }

      await pool.execute(
        `UPDATE user SET profile_img = ?, intro = ? WHERE user_id = ?`,
        [destination, intro, user_id]
      );
    }

    result_code = 200;
    message = "내 프로필 수정 성공";
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

// 좋아요 누른 애니메이션 조회하기
router.get("/like_anime_content", async (req, res, next) => {
  const { user_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";

  try {
    const [my_like_content] = await pool.execute(
      `SELECT anime_id, poster_img, title FROM anime_contents WHERE anime_id in (SELECT content_id FROM dimo_like WHERE user_id = ?)`,
      [user_id]
    );
    console.log(my_like_content);
    if (my_like_content[0] == null) {
      result_code = 201;
      message = "좋아요 누른 애니메이션 없음";
    } else {
      result_code = 200;
      message = "좋아요 누른 애니메이션 조회 성공";
    }

    return res.json({
      code: result_code,
      message: message,
      like_content_info: my_like_content,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// 좋아요 누른 영화 조회하기
router.get("/like_movie_content", async (req, res, next) => {
  const { user_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    const [my_like_content] = await pool.execute(
      `SELECT content_id FROM dimo_like WHERE user_id = ? and content_type = 'movie'`,
      [user_id]
    );
    if (my_like_content[0] == null) {
      result_code = 201;
      message = "좋아요 누른 영화 없음";
    } else {
      result_code = 200;
      message = "좋아요 누른 영화 조회 성공";
    }

    return res.json({
      code: result_code,
      message: message,
      like_content: my_like_content,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

//내가 쓴 댓글 조회하기
router.get("/comment", async (req, res, next) => {
  const { user_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    const [my_comment] = await pool.execute(
      `SELECT title, review_comment.comment_id, review_comment.review_id, review_comment.user_id, comment_like, comment_content, comment_spoiler, anime_character.character_id, anime_character.anime_id, anime_character.character_img, anime_character.character_name, anime_character.character_mbti FROM review_comment JOIN anime_character ON review_comment.character_id = anime_character.character_id JOIN anime_contents ON anime_contents.anime_id = anime_character.anime_id WHERE user_id = ? ORDER BY review_comment.comment_id DESC`,
      [user_id]
    );
    if (my_comment[0] == null) {
      result_code = 201;
      message = "작성한 댓글이 없습니다.";
    } else {
      result_code = 200;
      message = "작성한 댓글을 조회했습니다.";
    }

    return res.json({
      code: result_code,
      message: message,
      comment: my_comment,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

//내가 쓴 리뷰 조회하기
router.get("/review", async (req, res, next) => {
  const { user_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    const [my_review] = await pool.execute(
      `SELECT title, character_review.review_id, character_review.user_id, character_review.character_id, character_review.review_content, character_review.review_like, character_review.review_hits, character_review.review_spoiler, anime_character.anime_id, anime_character.character_img, anime_character.character_name, anime_character.character_mbti FROM character_review JOIN anime_character ON character_review.character_id = anime_character.character_id JOIN anime_contents ON anime_character.anime_id = anime_contents.anime_id WHERE user_id = ?`,
      [user_id]
    );
    if (my_review[0] == null) {
      result_code = 201;
      message = "작성한 리뷰가 없습니다.";
    } else {
      result_code = 200;
      message = "작성한 리뷰를 조회했습니다.";
    }

    return res.json({
      code: result_code,
      message: message,
      review: my_review,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

//투표 완료한 캐릭터 조회
router.get("/voted_character", async (req, res, next) => {
  const { user_id } = req.query;
  let result_code = 404;
  let message = "에러가 발생했습니다.";
  try {
    const [is_voted] = await pool.execute(
      `SELECT vote_id, anime_character.character_id, user_mbti, title, user_id, energy, recognization, prediction, reaction, content_id, character_img, character_name, character_mbti FROM anime_character_vote JOIN anime_character ON anime_character_vote.character_id = anime_character.character_id JOIN anime_contents ON anime_contents.anime_id = anime_character_vote.content_id WHERE user_id = ? ORDER BY vote_id DESC`,
      [user_id]
    );
    if (is_voted[0] == null) {
      result_code = 201;
      message = "투표한 캐릭터가 없습니다.";
    } else {
      result_code = 200;
      message = "투표한 캐릭터를 조회했습니다.";
    }

    return res.json({
      code: result_code,
      message: message,
      voted_character: is_voted,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;

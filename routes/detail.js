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
  let message = "에러가 발생했습니다.";

  try {
    const [post_grade] = await pool.execute(
      `INSERT INTO dimo_grade (grade, user_id, content_id, content_type) VALUES (?, ?, ?, ?)`,
      [grade, user_id, contentId, content_type]
    );
    result_code = 200;
    message = "평점을 저장했습니다.";
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

router.get("/animedata/:contentId", async (req, res, next) => {
  try {
    let contentId = req.params.contentId;
    let [detail] = await pool.execute(
      `SELECT url_type FROM anime_contents WHERE anime_content_id = ?`,
      [contentId]
    );

    let url = "https://anime.onnada.com/";
    if (detail[0].url_type == 0) {
      url += contentId + "/nav/good";
    } else if (detail[0].url_type == 2) {
      url += contentId + "/nav/quarter";
    } else {
      url += contentId;
    }
    // 크롤링 시작
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const results = [];
    const page = await browser.newPage();
    await page.goto(url.trim());

    // 포스터 이미지
    const posterElement = await page.$(".view-info .image img");
    const posterImg = await page.evaluate(
      (element) => element.getAttribute("src"),
      posterElement
    );

    // 프로필+캐릭터명, 작품명, 줄거리
    const grabData = await page.$$eval(".view-chacon li", (items) => {
      const data = [];

      for (const item of items) {
        const photoDiv = item.querySelector(".photo");
        const listDiv = item.querySelector(".list");
        let characterImg = "";
        let characterName = "";

        if (photoDiv) {
          const img = photoDiv.querySelector("img");
          if (img) {
            characterImg = img.getAttribute("src");
          }
        }

        if (listDiv) {
          const box1 = listDiv.querySelector(".box1");
          if (box1) {
            characterName = box1.querySelector(".name").textContent;
          }
        }

        data.push({
          characterImg,
          characterName,
        });
      }

      const titleTag = document.querySelector(".view-title h1");
      const title = titleTag ? titleTag.innerHTML : "";

      const plotTag = document.querySelector(".c");
      const plot = plotTag ? plotTag.innerHTML : "";

      return {
        title,
        plot,
        items: data,
      };
    });

    // 장르
    const genreElement = await page.$x(
      '//span[starts-with(text(), "장르")]/following-sibling::span[1]'
    );
    const genre = await page.evaluate(
      (element) => element.textContent,
      genreElement[0]
    );

    // 감독
    const directorElement = await page.$x(
      '//span[starts-with(text(), "감독")]/following-sibling::span[1]'
    );
    const director = await page.evaluate(
      (element) => element.textContent,
      directorElement[0]
    );

    // 방영일
    const releaseElement = await page.$x(
      '//span[starts-with(text(), "방영일")]/following-sibling::span[1]'
    );
    const release = await page.evaluate(
      (element) => element.textContent,
      releaseElement[0]
    );

    // 등급
    const rateElement = await page.$x(
      '//span[starts-with(text(), "등급")]/following-sibling::span[1]'
    );
    const rate = await page.evaluate(
      (element) => element.textContent,
      rateElement[0]
    );

    results.push({
      contentId: contentId,
      poster: posterImg,
      title: grabData.title,
      plot: grabData.plot,
      genre: genre,
      director: director,
      release: release,
      rate: rate,
      characters: grabData.items,
    });

    await page.close();

    await browser.close();
    // 크롤링 종료

    res.json(results[0]);
  } catch (error) {
    console.error("Error during crawling:", error);
    res.status(500).send("Error during crawling");
  }
});

module.exports = router;

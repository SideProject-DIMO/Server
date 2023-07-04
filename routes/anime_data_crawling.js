const pool = require("../db");
const puppeteer = require("puppeteer");
const express = require("express");
const router = express.Router();
const readline = require("readline");
const fs = require("fs");

router.get("/animedata", async (req, res) => {
  try {
    // 크롤링 시작
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    //urls.txt 크롤링 순환
    const urls = fs.readFileSync("urls.txt", "utf-8").split("\n");

    const results = [];
    for (let url of urls) {
      if (url.trim() !== "") {
        const page = await browser.newPage();
        await page.goto(url.trim());

        // 콘텐츠 고유번호 추출
        const contentId = url.match(/\.com\/(\d+)/)[1];

        // // 포스터 이미지
        // const posterElement = await page.$(".view-info .image img");
        // const posterImg = await page.evaluate(
        //   (element) => element.getAttribute("src"),
        //   posterElement
        // );

        // 프로필+캐릭터명, 작품명, 줄거리
        const grabData = await page.$$eval(".view-chacon li", (items) => {
          const data = [];

          //캐릭터 정보 최대 20명까지만
          for (let i = 0; i < Math.min(items.length, 20); i++) {
            const item = items[i];
            const photoDiv = item.querySelector(".photo");
            const listDiv = item.querySelector(".list");
            let characterImg = "";
            let characterName = "";

            if (photoDiv) {
              const img = photoDiv.querySelector("img");
              if (img) {
                characterImg = img.getAttribute("data-original");
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

        // // 장르
        // const genreElement = await page.$x(
        //   '//span[starts-with(text(), "장르")]/following-sibling::span[1]'
        // );
        // let genre = await page.evaluate(
        //   (element) => element.textContent,
        //   genreElement[0]
        // );

        // // 감독
        // const directorElement = await page.$x(
        //   '//span[starts-with(text(), "감독")]/following-sibling::span[1]'
        // );
        // let director = await page.evaluate(
        //   (element) => element.textContent,
        //   directorElement[0]
        // );

        // // 방영일
        // const releaseElement = await page.$x(
        //   '//span[starts-with(text(), "방영일")]/following-sibling::span[1]'
        // );
        // let release = await page.evaluate(
        //   (element) => element.textContent,
        //   releaseElement[0]
        // );

        // // 등급
        // const rateElement = await page.$x(
        //   '//span[starts-with(text(), "등급")]/following-sibling::span[1]'
        // );
        // let rate = await page.evaluate(
        //   (element) => element.textContent,
        //   rateElement[0]
        // );

        // //콘텐츠 업데이트 시, 사용
        // let url_type = 2;
        // if (url.indexOf("good") != -1) {
        //   url_type = 0;
        // } else if (url.indexOf("quarter") != -1) {
        //   url_type = 1;
        // }

        // const [check_anime_data] = await pool.execute(
        //   `SELECT anime_content_id FROM anime_contents WHERE anime_content_id = ? `,
        //   [contentId]
        // );

        // if (check_anime_data[0] == null) {
        // const [save_anime_data] = await pool.execute(
        //   `INSERT INTO anime_contents (anime_content_id, url_type) VALUES (?, ?)`,
        //   [contentId, url_type]
        // );
        // }

        async function saveData() {
          // for (let i; i < grabData.items.length; i++) {
          let i = 0;
          while (true) {
            await pool.execute(
              `INSERT INTO anime_character (anime_id, character_img, character_name) VALUES (?, ?, ?)`,
              [
                contentId,
                grabData.items[i].characterImg,
                grabData.items[i].characterName,
              ]
            );
            i++;
            if (i == grabData.items.length - 1) {
              break;
            }
          }
        }

        saveData();

        // for (let i; i < grabData.items.length; i++) {
        //   console.log("들어가나");
        //   await pool.execute(
        //     `INSERT INTO anime_character (anime_id, character_img, character_name) VALUES (?, ?, ?)`,
        //     [
        //       contentId,
        //       grabData.items[i].characterImg,
        //       grabData.items[i].characterName,
        //     ]
        //   );
        // }

        // if (grabData.genre == undefined) {
        //   grabData.genre = null;
        // }
        // if (director == undefined) {
        //   director = null;
        // }
        // if (release == undefined) {
        //   release = null;
        // }
        // if (rate == undefined) {
        //   rate = null;
        // }

        // const [save_anime_data] = await pool.execute(
        //   `INSERT INTO anime_contents VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        //   [
        //     contentId,
        //     grabData.title,
        //     genre,
        //     grabData.plot,
        //     posterImg,
        //     director,
        //     release,
        //     rate,
        //   ]
        // );

        // results.push({
        //   contentId: contentId,
        //   poster: posterImg,
        //   title: grabData.title,
        //   plot: grabData.plot,
        //   genre: genre,
        //   director: director,
        //   release: release,
        //   rate: rate,
        //   characters: grabData.items,
        // });

        await page.close();
      }
    }

    await browser.close();
    // 크롤링 종료

    res.json(results);
  } catch (error) {
    console.error("Error during crawling:", error);
    res.status(500).send("Error during crawling");
  }
});

module.exports = router;

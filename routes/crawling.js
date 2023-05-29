const express = require("express");
const app = express();
const puppeteer = require("puppeteer");
const mysql = require("mysql2/promise");

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Anime 데이터 크롤링 함수 정의
async function scrapeAnimeData() {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.goto("https://anime.onnada.com/4791/nav/quarter");

  const grabData = await page.evaluate(() => {
    //캐릭터 프로필 이미지 + 캐릭터명
    const characterImgTags = document.querySelectorAll(".photo img");
    const characterNameTags = document.querySelectorAll(".list");

    let combinedData = [];

    for (let i = 1; i < characterImgTags.length + 1; i++) {
      const characterImgTag = characterImgTags[i - 1];
      const characterNameTag = characterNameTags[i];

      const characterImg = characterImgTag.innerHTML;
      const characterInfo = characterNameTag.querySelectorAll("span");
      const characterName = characterInfo[0].innerText;

      combinedData.push({
        characterImg,
        characterName,
      });
    }

    //상세 정보(감독, 장르, 방영일, 등급)
    const infoTag = document.querySelectorAll(".block");
    const director = infoTag[5].textContent.trim(); //감독
    const genre = infoTag[11].textContent.trim(); //장르
    const releaseDate = infoTag[19].textContent.trim(); //방영일
    const rate = infoTag[21].textContent.trim(); //등급/관람가

    //작품 포스터 이미지
    const posterTag = document.querySelector(".image img");
    const posterImg = posterTag.innerHTML;

    //작품명
    const titleTag = document.querySelector(".view-title h1");
    const title = titleTag.innerHTML;

    //줄거리
    const storyTag = document.querySelector(".c");
    const story = storyTag.innerHTML;

    return {
      title,
      story,
      posterImg,
      data: combinedData,
      director,
      genre,
      releaseDate,
      rate,
    };
  });

  await browser.close();

  return grabData;
}

// API 라우트 설정
app.get("/api/animes", async (req, res) => {
  try {
    const animeData = await scrapeAnimeData(); // 크롤링한 데이터 가져오기
    res.json(animeData); // JSON 형태로 데이터 반환
  } catch (error) {
    res
      .status(500)
      .json({error: "애니메이션 정보를 가져오는 중에 오류가 발생했습니다."});
  }
});

// MySQL 연결 설정
(async () => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "username",
      password: "password",
      database: "animeDB",
    });

    // 크롤링 및 데이터 삽입 시작
    const animeData = await scrapeAnimeData();

    // Anime 데이터 삽입
    const characterData = animeData.data.map(
      ({characterImg, characterName}) => [characterImg, characterName]
    );
    await connection.query(
      "INSERT INTO anime (character_img, character_name) VALUES ?",
      [characterData]
    );

    // AnimeInfo 데이터 삽입
    const animeInfoData = [
      animeData.title,
      animeData.story,
      animeData.posterImg,
      animeData.director,
      animeData.genre,
      animeData.releaseDate,
      animeData.rate,
    ];
    await connection.query(
      "INSERT INTO anime_info (title, story, poster_img, director, genre, release_date, rate) VALUES (?, ?, ?, ?, ?, ?, ?)",
      animeInfoData
    );

    console.log("데이터가 MySQL에 저장되었습니다.");

    await connection.end();
  } catch (error) {
    console.error("MySQL 연결 또는 데이터 삽입 중 오류가 발생했습니다:", error);
  }
})();

// 서버 시작
app.listen(3000, () => {
  console.log("서버가 3000번 포트에서 실행 중입니다.");
});

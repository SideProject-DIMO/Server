const express = require('express');
const app = express();
const router = express.Router();
const axios = require('axios');

router.get('/moviedata', async (req, res) => {
  try {
    // 영화 ID
    const movieId = req.query.movieId; // 요청 쿼리 파라미터로부터 영화 ID 받기

    // TMDB API 키
    const apiKey = '9e43a6867c994baa79d59e3d65755b86';

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

        // 영화 정보
        const movieInfo = response.data;
        const title = movieInfo.title;
        const posterImg = movieInfo.poster_path;
        const movieID = movieInfo.belongs_to_collection.id;

        // 영화 정보 return
        return {
          title,
          posterImg,
          movieID,
        };
      } catch (error) {
        throw new Error(error.message);
      }
    }

    // 영화 정보 가져오기
    const movieInfo = await getMovieInfo(movieId);

    res.json(movieInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

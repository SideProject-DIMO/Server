const express = require('express');
const app = express();
let bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  res.send('success');
});

//회원가입
app.use('/signup', require('./routes/dimo_signup.js'));

//로그인&로그아웃&탈퇴
app.use('/social', require('./routes/social_login.js'));
app.post('/login', require('./routes/standard_login.js'));
app.get('/logout', require('./routes/logout'));
app.post('/drop', require('./routes/drop.js'));

//회원정보변경
app.use('/user_info', require('./routes/change_user_info'));

//크롤링
app.use('/crawling', require('./routes/crawling.js'));

//홈 조회
app.use("/home", require("./routes/home.js"));

//상세 조회
app.use('/detail', require('./routes/detail.js'));

//나의 모멘텀 조회
app.use("/my_momentum", require("./routes/my_momentum.js"));

app.use(require("./routes/auth_middleware"));

app.listen(3000, function () {
  console.log('server is running.');
});

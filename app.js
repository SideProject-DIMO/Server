const express = require("express");
const app = express();
let bodyParser = require("body-parser");
const loginRouter = require("./routes/dimo_login.js");
const signupRouter = require("./routes/signup.js");
// const googleLoginRouter = require("./routes/googleLogin.js");
// const kakaoLoginRouter = require("./routes/kakaoLogin.js");

const logoutRouter = require("./routes/logout");

const auth_middleware = require("./routes/auth_middleware");

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get("/", async (req, res) => {
  res.send("success");
});

app.use("/signup", signupRouter);

// app.post("/kakaoLogin", kakaoLoginRouter);
// app.post("/googleLogin", googleLoginRouter);

app.post("/login", loginRouter);
app.get("/logout", logoutRouter);

app.use(auth_middleware);

app.listen(3000, function () {
  console.log("server is running.");
});

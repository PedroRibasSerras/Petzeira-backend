/** @format */

const express = require("express");
const session = require("express-session");
const cors = require("cors");

const userRegisterRoutes = require("./routes/userRegister");
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const moduleRoutes = require("./routes/modulo");

const authMiddleware = require("./middlewares/auth");
const mqtt = require("./middlewares/mqtt");
const cookieParser = require("cookie-parser");

require("dotenv").config();
const env = process.env.ENV;
const port = process.env.PORT;
const settings = (require("./settings"))[env]

const app = express();

app.use(express.json());
app.use(cors(settings.cors));
app.use(cookieParser());
app.use(session(settings.session));
app.use(mqtt());

app.use("/auth", authRoutes);
app.use(userRegisterRoutes);
app.use(authMiddleware);
app.use("/user", userRoutes);
app.use("/module", moduleRoutes);

app.listen(port, () => {
	console.log(`Server listening on ${settings.url}:${port}`);
});

/** @format */

const express = require("express");
const session = require("express-session");
const PetzeiraMqtt = require("./services/petzeira-mqtt/petzeiraMqtt")

const petzeiraMqtt = new PetzeiraMqtt()

const userRegisterRoutes = require("./routes/userRegister");
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const moduleRoutes = require("./routes/modulo");

const authMiddleware = require("./middlewares/auth");
const cookieParser = require("cookie-parser");

require("dotenv").config();
const secret = process.env.SECRET;

const app = express();
const port = 3333;

petzeiraMqtt.connect()

app.use(express.json());
app.use(cookieParser());

app.use(
	session({
		name: "ss",
		secret,
		resave: false,
		saveUninitialized: false,
		cookie: {
			domain: "localhost",
			maxAge: 86400000, // Tempo de vida do cookie: 24 horas
			secure: false, // O cookie só será enviado em conexões HTTPS
			httpOnly: false, // O cookie não pode ser acessado por JavaScript no navegador
			sameSite: "none", // O cookie só será enviado em solicitações do mesmo site
		},
		rolling: true,
	})
);

app.use("/auth", authRoutes);
app.use(userRegisterRoutes);
app.use(authMiddleware);
app.use("/user", userRoutes);
app.use("/module", moduleRoutes);

app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
});

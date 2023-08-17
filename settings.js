/** @format */

require("dotenv").config();
const secret = process.env.SECRET;

let settings = {
	DEV: {
		cors: { origin: "http://localhost:3000", credentials: true },
		session: {
			name: "ss",
			secret,
			resave: false,
			saveUninitialized: false,
			cookie: {
				domain: "localhost",
				maxAge: 86400000, // Tempo de vida do cookie: 24 horas
				secure: false, // O cookie só será enviado em conexões HTTPS
				httpOnly: false, // O cookie não pode ser acessado por JavaScript no navegador
				// sameSite: "none", // O cookie só será enviado em solicitações do mesmo site
			},
		},
        url:"http://localhost"
	},
	PROD: {
		cors: {
			origin: "http://pedroribasserras.space:3000",
			credentials: true,
		},
		session: {
			name: "ss",
			secret,
			resave: false,
			saveUninitialized: false,
			cookie: {
				domain: "pedroribasserras.space",
				maxAge: 86400000, // Tempo de vida do cookie: 24 horas
				secure: false, // O cookie só será enviado em conexões HTTPS
				httpOnly: false, // O cookie não pode ser acessado por JavaScript no navegador
				// sameSite: "none", // O cookie só será enviado em solicitações do mesmo site
			},
		},
        url:"http://api.pedroribasserras.space"
	},
};

module.exports = settings;

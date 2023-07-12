/** @format */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		if (password === undefined || email === undefined) {
			response = {
				error: "Missing arguments error",
				missinArguments: [],
			};
			if (email === undefined) {
				response.missinArguments.push("email");
			}
			if (password === undefined) {
				response.missinArguments.push("password");
			}

			return res.status(401).json(response);
		}

		const user = await prisma.user.findUnique({
			where: {
				email: email,
			},
			select: {
				id: true,
				name: true,
				email: true,
				password: true,
			},
		});

		if (!user) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		const passwordMatch = await bcrypt.compare(password, user.password);
		delete user.password;

		if (!passwordMatch) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		req.session.user = user;
		req.session.save();

		// res.cookie('rememberme', 'yes', { maxAge: 900000, httpOnly: false});

		res.json({ message: "Login successful", data: user });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/logout", async (req, res) => {
	if (req.session && req.session.user) {
		req.session.destroy((err) => {
			if (err) {
				console.log("Erro ao destruir a sessão:", err);
			}
		});
		return res
			.status(200)
			.json({ message: "Account successfully disconnected" });
	}
	res.status(400).json({ error: "Empty session" });
});

// Outras rotas relacionadas aos usuários...

module.exports = router;

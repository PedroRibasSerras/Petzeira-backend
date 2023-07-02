const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
	try {
		const { name, email, password } = req.body;
		if (name === undefined || password === undefined || email === undefined) {
			response = {
				error: "Missing arguments error",
				missinArguments: [],
			};
			if (name === undefined) {
				response.missinArguments.push("name");
			}
			if (email === undefined) {
				response.missinArguments.push("email");
			}
			if (password === undefined) {
				response.missinArguments.push("password");
			}

			return res.status(400).json(response);
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({
			data: {
				name,
				email: email.toLowerCase(),
				password: hashedPassword,
			},
			select: {
				id: true,
			},
		});

		if (user.id) {
			res.json({ message: "Account successfuly created!" });
		}
	} catch (error) {
		console.log(error)
		if (error.meta && error.meta.target)
			switch (error.meta.target) {
				case "User_email_key":
					return res.status(400).json({ error: "Email already used" });
			}

		return res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;

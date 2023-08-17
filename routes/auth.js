/** @format */

const express = require("express");
const router = express.Router();
const areParametersUndefine = require("../utils/areParametersUndefine");
const userService = require("../services/user");

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		areParametersUndefine([
			{ name: "email", value: email },
			{ name: "password", value: password },
		]);

		const user = userService.getUserByEmail(email);

		if (!user) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		userService.verifyUserPassword(password, user);
		delete user.password;

		if (!passwordMatch) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		req.session.user = user;
		req.session.save();

		return res.json({ message: "Login successful", data: user });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/logout", async (req, res) => {
	try {
		if (req.session && req.session.user) {
			req.session.destroy((err) => {
				if (err) {
					console.log("Destroy session error:", err);
				}
			});
			return res
				.status(200)
				.json({ message: "Account successfully disconnected" });
		}
		return res.status(400).json({ error: "Empty session" });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;

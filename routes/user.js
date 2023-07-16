/** @format */

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.post("/getAll", async (req, res) => {
	try {
		const { adminPass } = req.body;
		if (adminPass == "petzeiraBrabo") {
			const users = await prisma.user.findMany({
				select: {
					id: true,
					name: true,
					email: true,
				},
			});
			res.json(users);
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.get("", async (req, res) => {
	res.json(req.session.user)
}); 

module.exports = router;

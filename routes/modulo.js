/** @format */

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { generateToken, verifyToken } = require("../utils/mqttToken");

const prisma = new PrismaClient();

router.get("/", async (req, res) => {
	try {
		const { serial } = req.body;
		const ownerId = req.session.user.id

		const modules = await prisma.module.findMany({
			where:{
				ownerId,
				serial
			}
		});
		res.json(modules);
		
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/subscribe", async (req, res) => {
	try {
		const { serial, moduleType, name } = req.body;
		const ownerId = req.session.user.id

		if(name == undefined){
			name = serial + moduleType
		}
		
		const users = await prisma.module.create({
			data:{
				name,
				serial,
				type: moduleType,
				ownerId,
			}
		});
		res.json(users);
		
	} catch (error) {
		if (error.meta && error.meta.target)
			switch (error.meta.target) {
				case "PRIMARY":
					return res.status(402).json({ error: "Module already registered" });
			}
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/mqtt-token", async (req, res) => {
	try {
		const { serial } = req.body;
		const ownerId = req.session.user.id

		const modules = await prisma.module.findMany({
			where:{
				ownerId,
				serial
			}
		});
		
		if(modules.length == 0){
			return res.status(401).json({ error: "This module is not bound with the user" });
		}


		const machine = { serial };
		const mqttToken = generateToken(machine)
		
		res.json({mqttToken});
		
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/mqtt-token/verify", async (req, res) => {
	try {
		const { mqttToken } = req.body;
		if(verifyToken(mqttToken)){
			res.json({ message: "Token successfuly verifyed" });
		}
		else{
			res.status(400).json({ error: "Invalid token" });
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});


module.exports = router;

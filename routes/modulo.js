/** @format */

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { generateToken, verifyToken } = require("../utils/mqttToken");

const prisma = new PrismaClient();

router.get("/", async (req, res) => {
	try {
		const { serial } = req.body;
		const ownerId = req.session.user.id;

		const modules = await prisma.module.findMany({
			where: {
				ownerId,
				serial,
			},
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
		const ownerId = req.session.user.id;

		if (name == undefined) {
			name = serial + moduleType;
		}

		const users = await prisma.module.create({
			data: {
				name,
				serial,
				type: moduleType,
				ownerId,
			},
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
		const ownerId = req.session.user.id;

		const modules = await prisma.module.findMany({
			where: {
				ownerId,
				serial,
			},
		});

		if (modules.length == 0) {
			return res
				.status(401)
				.json({ error: "This module is not bound with the user" });
		}

		const machine = { serial };
		const mqttToken = generateToken(machine, "24h");

		res.json({ mqttToken });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/mqtt-token/verify", async (req, res) => {
	try {
		const { mqttToken } = req.body;
		if (verifyToken(mqttToken)) {
			res.json({ message: "Token successfuly verifyed" });
		} else {
			res.status(400).json({ error: "Invalid token" });
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.get("/schedule", async (req, res) => {
	try {
		const { serial, moduleType: type } = req.body;

		let petzeiraModule = await prisma.module.findUnique({
			where: {
				serial_type: { serial, type },
			},
			select: {
				ownerId: true,
				scheduling: {
					select:{
						id:true,
						moduleSerial:true,
						moduleType:true,
						time:true
					}
				},
			},
		});

		if (!petzeiraModule) {
			throw "No Module Error";
		}

		if (petzeiraModule.ownerId != req.session.user.id) {
			throw "Unauthorized";
		}

		res.json(petzeiraModule.scheduling);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/schedule", async (req, res) => {
	try {
		console.log("schedule")
		const { serial, moduleType: type, time } = req.body;
		
		let petzeiraModule = await prisma.module.findUnique({
			where: {
				serial_type: { serial, type },
			},
			select: {
				ownerId: true,
			},
		});

		if (!petzeiraModule) {
			throw "No Module Error";
		}

		if (petzeiraModule.ownerId != req.session.user.id) {
			throw "Unauthorized";
		}

		let [hours,minutes] = String(time).split(":")
		hours += 3
		newTime = hours * 60 * 60 + minutes * 60
		let newSchedule = await prisma.scheduling.create({
			data: {
				moduleSerial: serial,
				moduleType: type,
				time: `${newTime}`,
			},
		});
		console.log("after create")

		res.json(newSchedule);

		let schedules = await prisma.scheduling.findMany({
			where: {
				moduleSerial: serial,
				moduleType: type,
			},
			select:{
				id:true,
				moduleSerial:true,
				moduleType:true,
				time:true
			}
		});

		req.mqttClient.sendCommand(serial, "sendSchedule", JSON.stringify(schedules));
	} catch (error) {
		console.error(error);
		if (error.meta && error.meta.target)
			switch (error.meta.target) {
				case "Scheduling_moduleSerial_moduleType_time_key":
					return res.status(400).json({ error: "Time already scheduled" });
			}
		res.status(500).json({ error: "Internal server error" });
	}
});

router.delete("/schedule", async (req, res) => {
	try {
		const { schedulingId } = req.body;

		let schedule = await prisma.scheduling.findUnique({
			where: {
				id: schedulingId,
			},
			select: {
				module: { select: { ownerId: true, serial: true, type: true } },
			},
		});

		if (!schedule) {
			return res.status(400).json({ error: "No Scheduling Error" });
		}

		if (schedule.module.ownerId != req.session.user.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		let wasDeleted = await prisma.scheduling.delete({
			where: {
				id: schedulingId,
			},
			select: {
				id: true,
			},
		});

		if (!wasDeleted) {
			return res.status(400).json({ error: "Scheduling Delete Error" });
		}

		
		res.json({ message: "Scheduling Deleted Successfuly" });

		let schedules = await prisma.scheduling.findMany({
			where: {
				moduleSerial: schedule.module.serial,
				moduleType: schedule.module.type,
			},
		});

		req.mqttClient.sendCommand(schedule.module.serial, "sendSchedule", JSON.stringify(schedules));

		
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

router.get("/fed", async (req, res) => {
	try {
		const { serial, moduleType: type, limit, page } = req.body;
		let eventsQueryConfig = {
			where: {
				event: "fed",
			},
		};
		if (limit != undefined && page != undefined) {
			eventsQueryConfig.skip = page * limit;
			eventsQueryConfig.take = limit;
		}

		let petzeiraModule = await prisma.module.findUnique({
			where: {
				serial_type: { serial, type },
			},
			select: {
				ownerId: true,
				events: eventsQueryConfig,
			},
		});

		if (!petzeiraModule) {
			return res.status(400).json({ error: "No Module Error" });
		}

		if (petzeiraModule.ownerId != req.session.user.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		console.log(petzeiraModule)
		res.json(petzeiraModule.events);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/fed", async (req, res) => {
	try {
		const { serial, moduleType: type} = req.body;
		let petzeiraModule = await prisma.module.findUnique({
			where: {
				serial_type: { serial, type },
			},
			select: {
				ownerId: true,
			},
		});

		if (!petzeiraModule) {
			return res.status(400).json({ error: "No Module Error" });
		}

		if (petzeiraModule.ownerId != req.session.user.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		req.mqttClient.sendCommand(serial, "act", JSON.stringify({type}));


		res.json({message: "Requested successfuly"});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/calibre", async (req, res) => {
	try {
		const { serial, moduleType: type, calibreWeight} = req.body;
		let petzeiraModule = await prisma.module.findUnique({
			where: {
				serial_type: { serial, type },
			},
			select: {
				ownerId: true,
			},
		});

		if (!petzeiraModule) {
			return res.status(400).json({ error: "No Module Error" });
		}

		if (petzeiraModule.ownerId != req.session.user.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		req.mqttClient.sendCommand(serial, "calibre", JSON.stringify({moduleType: type, calibreWeight}));


		res.json({message: "Requested successfuly"});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});


router.get("/measurements", async (req, res) => {
	try {
		const { serial, moduleType: type, limit, page } = req.body;
		let measurementsQueryConfig = {};
		if (limit != undefined && page != undefined) {
			measurementsQueryConfig.skip = page * limit;
			measurementsQueryConfig.take = limit;
		} else {
			measurementsQueryConfig = true;
		}

		let petzeiraModule = await prisma.module.findUnique({
			where: {
				serial_type: { serial, type },
			},
			select: {
				ownerId: true,
				measurements: measurementsQueryConfig,
			},
		});

		if (!petzeiraModule) {
			return res.status(400).json({ error: "No Module Error" });
		}

		if (petzeiraModule.ownerId != req.session.user.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		res.json(petzeiraModule.measurements);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/measurements", async (req, res) => {
	try {
		const { serial, moduleType: type} = req.body;
		let petzeiraModule = await prisma.module.findUnique({
			where: {
				serial_type: { serial, type },
			},
			select: {
				ownerId: true,
			},
		});

		if (!petzeiraModule) {
			return res.status(400).json({ error: "No Module Error" });
		}

		if (petzeiraModule.ownerId != req.session.user.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		req.mqttClient.sendCommand(serial, "read", JSON.stringify({type}));


		res.json({message: "Requested successfuly"});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.get("/events", async (req, res) => {
	try {
		const { serial, moduleType: type} = req.body;

		let petzeiraModule = await prisma.module.findUnique({
			where: {
				serial_type: { serial, type },
			},
			select: {
				ownerId: true,
				events: true,
			},
		});

		if (!petzeiraModule) {
			return res.status(400).json({ error: "No Module Error" });
		}

		if (petzeiraModule.ownerId != req.session.user.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		console.log(petzeiraModule)
		res.json(petzeiraModule.events);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const eventService = require("../event")

const saveComandEvent = async (data) => {
	try {
		await eventService.saveModuleEvent(data.serial, data.moduleType, data.event, data.extraData)
	} catch (error) {
		console.log(error);
		throw error;
	}
};


let commands = {

	sendSchedule: async (petzeiraMqtt, data) => {
		if (data.message && data.message == "ok") {
			saveComandEvent(data);
			return;
		}
	},

	calibre: async (petzeiraMqtt, data) => {
		if (data.message && data.message == "ok") {
			data.extraData = `${data.calibreWeight}`;
			saveComandEvent(data);
			return;
		}
	},

	schedule: async (petzeiraMqtt, data) => {
		try {
			let schedule = await prisma.scheduling.findMany({
				where: {
					moduleType: data.moduleType,
					moduleSerial: data.serial,
				},
				select:{
					moduleType:true,
					time:true,
				}
			});
			if (!schedule) {
				petzeiraMqtt.sendCommand(data.serial, data.command, "[]");
			} else {
				petzeiraMqtt.sendCommand(
					data.serial,
					data.command,
					JSON.stringify(schedule)
				);
			}
			console.log(schedule)
		} catch (error) {
			console.log(error)
			if (error.meta && error.meta.target)
				petzeiraMqtt.sendCommand(data.serial, data.command, error.meta.target);
			else petzeiraMqtt.sendCommand(data.serial, data.command, error);
		}
	},

	ping: async (petzeiraMqtt, data) => {
		try {
			let modulePetzeira = await prisma.module.findFirst({
				where: { serial: data.serial },
			});

			if (!modulePetzeira) {
				throw "No module";
			}
			let event = await prisma.event.create({
				data: {
					userId: modulePetzeira.ownerId,
					moduleSerial: data.serial,
					event: data.command,
				},
				select: { id: true },
			});

			if (!event) {
				throw "Event Creation Error";
			}

			petzeiraMqtt.sendCommand(data.serial, data.command, "ok");
		} catch (error) {
			console.log(error);
			if (error.meta && error.meta.target)
				petzeiraMqtt.sendCommand(data.serial, data.command, error.meta.target);
			else petzeiraMqtt.sendCommand(data.serial, data.command, error);
		}
	},

	send: async (petzeiraMqtt, data) => {
		try {
			let modulePetzeira = await prisma.module.findUnique({
				where: {
					serial_type: { serial: data.serial, type: data.moduleType },
				},
			});

			if (!modulePetzeira) {
				throw "No module";
			}

			//Save data
			let value = await prisma.measurement.create({
				data: {
					moduleSerial: data.serial,
					moduleType: data.moduleType,
					value: data.value,
				},
			});

			if (!value) {
				throw "Value Creation Error";
			}

			let event = await prisma.event.create({
				data: {
					userId: modulePetzeira.ownerId,
					moduleSerial: data.serial,
					moduleType: modulePetzeira.type,
					event: data.command,
				},
				select: { id: true },
			});

			if (!event) {
				throw "Event Creation Error";
			}

			petzeiraMqtt.sendCommand(data.serial, data.command, "ok");
		} catch (error) {
			if (error.meta && error.meta.target)
				petzeiraMqtt.sendCommand(data.serial, data.command, error.meta.target);
			else petzeiraMqtt.sendCommand(data.serial, data.command, error);
		}
	},

	act: async (petzeiraMqtt, data) => {
		await saveComandEvent(data);
	},

	read: async (petzeiraMqtt, data) => {
		try {
			let modulePetzeira = await prisma.module.findUnique({
				where: {
					serial_type: { serial: data.serial, type: data.moduleType },
				},
			});

			if (!modulePetzeira) {
				throw "No module";
			}

			//Save data
			let value = await prisma.measurement.create({
				data: {
					moduleSerial: data.serial,
					moduleType: data.moduleType,
					value: data.value,
				},
			});

			if (!value) {
				throw "Value Creation Error";
			}

			let event = await prisma.event.create({
				data: {
					userId: modulePetzeira.ownerId,
					moduleSerial: data.serial,
					moduleType: modulePetzeira.type,
					event: data.command,
				},
				select: { id: true },
			});

			if (!event) {
				throw "Event Creation Error";
			}
		} catch (error) {
			console.log("error");
		}
	},
	fed: async (petzeiraMqtt, data) => {
		try {
			await saveComandEvent(data);
			petzeiraMqtt.sendCommand(data.serial, data.command, "ok");
		} catch (error) {
			console.log(error);
			petzeiraMqtt.sendCommand(data.serial, data.command, error);
		}
	},
};

module.exports = commands
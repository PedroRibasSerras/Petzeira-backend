/** @format */

const mqtt = require("mqtt");
const { decodeToken } = require("../../utils/mqttToken");
require("dotenv").config();
const mqttSecret = process.env.MQTT_SECRET;
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const saveComandEvent = async (data) => {
	try {
		let modulePetzeira = await prisma.module.findUnique({
			where: {
				serial_type: { serial: data.serial, type: data.moduleType },
			},
		});

		if (!modulePetzeira) {
			throw "No Module Error";
		}

		let event = await prisma.event.create({
			data: {
				userId: modulePetzeira.ownerId,
				moduleSerial: data.serial,
				moduleType: modulePetzeira.type,
				event: data.command,
				extraData: data.extraData,
			},
			select: { id: true },
		});

		if (!event) {
			throw "Event Creation Error";
		}
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
			// {”message”:”ok”, “moduleType”:”<module_type>”, calibreWeight:”<value>”}
			data.extraData = `${data.calibreWeight}`;
			saveComandEvent(data, true);
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
		} catch (error) {
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

class PetzeiraMqtt {
	constructor(
		host = "api.pedroribasserras.space",
		port = "1883",
		clientId = undefined
	) {
		this.protocol = "mqtt";
		this.host = host;
		this.port = port;
		this.clientId = clientId || `mqtt_${Math.random().toString(16).slice(3)}`;

		this.connectUrl = `${this.protocoll}://${this.host}:${this.port}`;
		this.client = undefined;
	}

	connect() {
		this.client = mqtt.connect(this.connectUrl, {
			clientId: this.clientId,
			clean: true,
			connectTimeout: 4000,
			reconnectPeriod: 1000,
		});

		this.client.on("connect", this.config.bind(this));
	}

	config() {
		console.log("Connected");

		this.client.subscribe("client/#", {}, (error) => {
			if (error) {
				console.error("subscription failed", error);
			}
		});

		this.setTimeTimer();

		this.client.on(
			"message",
			((topic, message) => {
				console.log(`Received message on topic ${topic}: ${message}`);
				let topics = topic.split("/");
				let channel = topics[0];
				if (channel != "client") {
					throw "It's no a client channel!";
				}

				let tempMessage = String(message);
				let messageSize = tempMessage.split("\n").length;
				console.log(`Message size: ${messageSize}`);
				if (messageSize < 1) {
					this.sendMessage(topics[1], "Malformed message");
					return -1;
				}
				let hasData = messageSize > 3;

				let position = tempMessage.search("\n");
				let token = tempMessage.substring(0, position);
				console.log(token);

				tempMessage = tempMessage.substring(position + 1);
				position = tempMessage.search("\n");
				let command = tempMessage.substring(0, position);
				console.log(command);

				let data = {};
				if (hasData) {
					tempMessage = tempMessage.substring(position + 1);
					try {
						data = JSON.parse(tempMessage);
					} catch (error) {
						this.sendCommand(topics[1], command, "Malformed JSON");
						return -1;
					}
				}

				let decodedToken = decodeToken(token);
				if (!decodedToken) {
					this.sendCommand(topics[1], command, "Invalid TokenMqtt");
					return -1;
				}

				let serial = topics[1];
				if (serial !== decodedToken.serial) {
					this.sendCommand(topics[1], command, "Unauthorized");
					return -1;
				}

				data.serial = serial;
				data.command = command;
				if (commands[command]) commands[command](this, data);
				else {
					this.sendCommand(topics[1], command, "Command Not Found");
					return -1;
				}
			}).bind(this)
		);
	}

	setTimeTimer() {
		setInterval(this.sendDate.bind(this), 1000 * 60 * 1);
	}

	sendMessage(endpoint, message) {
		this.client.publish(
			endpoint,
			`${mqttSecret}\n${message}`,
			{ qos: 1, retain: false },
			(error) => {
				if (error) {
					console.error(error);
				}
			}
		);
	}

	sendServerMessage(endpoint, message) {
		this.sendMessage("server/" + endpoint, message);
	}

	sendCommand(endpoint, command, data) {
		let message = `${command}\n${data}`;
		this.sendServerMessage(endpoint, message);
	}

	sendDate() {
		let endpoint = "date";
		let message = `${Date.now()}`;
		this.sendMessage(endpoint, message);
	}

	sendMessageToClient(serial, message) {}
}

module.exports = PetzeiraMqtt;

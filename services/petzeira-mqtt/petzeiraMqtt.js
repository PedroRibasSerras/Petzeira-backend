/** @format */

const mqtt = require("mqtt");
const { decodeToken } = require("../../utils/mqttToken");
const commands = require("./commands")

require("dotenv").config();
const mqttSecret = process.env.MQTT_SECRET;

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
				// console.log(`Received message on topic ${topic}: ${message}`);
				let topics = topic.split("/");
				let channel = topics[0];
				if (channel != "client") {
					throw "It's no a client channel!";
				}

				let tempMessage = String(message);
				let messageSize = tempMessage.split("\n").length;
				// console.log(`Message size: ${messageSize}`);
				if (messageSize < 1) {
					this.sendMessage(topics[1], "Malformed message");
					return -1;
				}
				let hasData = messageSize > 3;

				let position = tempMessage.search("\n");
				let token = tempMessage.substring(0, position);
				// console.log(token);

				tempMessage = tempMessage.substring(position + 1);
				position = tempMessage.search("\n");
				let command = tempMessage.substring(0, position);
				// console.log(command);

				let data = {};
				if (hasData) {
					tempMessage = tempMessage.substring(position + 1);
					try {
						data = JSON.parse(tempMessage);
					} catch (error) {
						this.sendCommand(topics[1], command, "Malformed JSON");
						return -1;
					}

					// console.log(data)
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
		let now = new Date(Date.now())
		let message = `${(now.getHours() * 60 * 60 + now.getMinutes()* 60)}`;
		this.sendMessage(endpoint, message);
	}
}

module.exports = PetzeiraMqtt;

/** @format */

const mqtt = require("mqtt");
require("dotenv").config();
const mqttSecret = process.env.MQTT_SECRET;

class PetzeiraMqtt {
	constructor(host = "34.234.225.102", port = "1883", clientId = undefined) {
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

		this.client.on("connect",this.config.bind(this));
	}

	config() {
		console.log("Connected");

		this.client.subscribe("client/#", {}, (error) => {
			if (error) {
				console.error("subscription failed", error);
			}
		});

		this.client.subscribe("module/#", {}, (error) => {
			if (error) {
				console.error("subscription failed", error);
			}
		});

		this.setTimeTimer();

    this.client.on("message", (topic, message) => {
      console.log(`Received message on topic ${topic}: ${message}`);
    });
	}

	setTimeTimer() {
		setInterval(this.sendDate.bind(this), 1000 * 60 * 1);
	}

	sendMessage(endpoint, message) {
		this.client.publish(
			endpoint,
			`${mqttSecret}\n${message}`,
			{ qos: 0, retain: false },
			(error) => {
				if (error) {
					console.error(error);
				}
			}
		);
	}

	sendCommand(endpoint,command, data) {
    let message = `${command}\n${data}`
    this.sendMessage(endpoint, message)
  }

	sendDate() {
		let endpoint = "date";
		let message = `${Date.now()}`;
		this.sendMessage(endpoint, message);
	}

	sendMessageToClient(serial, message) {}
	
}

module.exports = PetzeiraMqtt;
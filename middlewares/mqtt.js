const PetzeiraMqtt = require("../services/petzeira-mqtt/petzeiraMqtt");
const petzeiraMqtt = new PetzeiraMqtt();
petzeiraMqtt.connect();

const mqtt = () => (req, res, next) => {
	req.mqttClient = petzeiraMqtt;
	next();
};

module.exports = mqtt


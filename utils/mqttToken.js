/** @format */

const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

const generateToken = (value, expiresIn = "1h") => {
	const token = jwt.sign(value, secret, { expiresIn });
	return token;
};

const verifyToken = (token) => {
	try {
		const decoded = jwt.verify(token, secret);
		if (decoded.exp < Date.now() / 1000) {
			// Token has expired
			return false;
		}
		return true;
	} catch (err) {
		// Token verification failed
		return false;
	}
};

const decodeToken = (token) => {
	try {
		const decoded = jwt.verify(token, secret);
		if (decoded.exp < Date.now() / 1000) {
			// Token has expired
			return false;
		}
		return decoded;
	} catch (err) {
		// Token verification failed
		return false;
	}
};

module.exports = { generateToken, verifyToken, decodeToken};

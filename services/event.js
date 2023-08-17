/** @format */
const moduleService = require("./module")
const machineService = require("./machine")

async function createEvent(data) {
	return await prisma.event.create({ data, select: { id: true } });
}

const saveUserEvent = async (userId, event, extraData) => {
	try {

        const data =  {
            userId: userId,
            event,
            extraData,
        }

        const eventResult = await createEvent(data)

		if (!eventResult) {
			throw { error:"Event Creation Error" };
		}
	} catch (error) {
		console.log(error);
		throw error;
	}
};

const saveMachineEvent = async (serial, event, extraData) => {
	try {
		const ownerId = machineService.getMachineOwnerId(serial)

		if (!ownerId) {
			throw {error: "No Machine Error"};
		}

        const data =  {
            userId: ownerId,
            moduleSerial: serial,
            event,
            extraData,
        }

        const eventResult = await createEvent(data)

		if (!eventResult) {
			throw { error:"Event Creation Error" };
		}
	} catch (error) {
		console.log(error);
		throw error;
	}
};

const saveModuleEvent = async (serial, moduleType, event, extraData) => {
	try {
		const modulePetzeira = await moduleService.getModuleById(serial, moduleType)

		if (!modulePetzeira) {
			throw {error: "No Module Error"};
		}

        const data =  {
            userId: modulePetzeira.ownerId,
            moduleSerial: serial,
            moduleType: moduleType,
            event,
            extraData,
        }

        const eventResult = await createEvent(data)

		if (!eventResult) {
			throw { error:"Event Creation Error" };
		}
	} catch (error) {
		console.log(error);
		throw error;
	}
};


module.exports = {createEvent, saveUserEvent, saveMachineEvent, saveModuleEvent}
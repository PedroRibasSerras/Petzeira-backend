const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getMachineOwnerId(serial){
    return await prisma.module.findFirst({
        where: {
            serial
        },
    });
}


module.exports = {getMachineOwnerId}
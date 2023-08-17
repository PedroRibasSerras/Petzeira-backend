const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getModuleById(serial, type){
    return await prisma.module.findUnique({
        where: {
            serial_type: { serial, type},
        },
    });
}


module.exports = {getModuleById}
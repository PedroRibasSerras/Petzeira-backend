const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function getUserByEmail(email){
    return user = await prisma.user.findUnique({
        where: {
            email: email,
        },
        select: {
            id: true,
            name: true,
            email: true,
            password: true,
        },
    });
}

async function verifyUserPassword(password, user){
    return await bcrypt.compare(password, user.password);
}

module.exports = {getUserByEmail, verifyUserPassword}
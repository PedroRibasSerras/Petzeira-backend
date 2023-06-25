const authenticateUser = (req, res, next) => {
    if (req.session && req.session.user) {
        // O usuário está autenticado, permitir o acesso
        next();
    } else {
    // O usuário não está autenticado, redirecionar para a página de login
    res.status(401).json({error:"Unauthorized"});
    }
}

module.exports = authenticateUser
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCron = verifyCron;
function verifyCron(req, res, next) {
    const token = req.headers.authorization;
    if (token !== `Bearer ${process.env.CRON_API_KEY}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const applyLateFees_service_1 = require("../services/billing/applyLateFees.service");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
router.post("/apply-late-fees", auth_1.verifyCron, async (_req, res) => {
    try {
        const result = await (0, applyLateFees_service_1.applyLateFees)();
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to apply late fees" });
    }
});
exports.default = router;

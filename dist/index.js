"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const billing_1 = __importDefault(require("./routes/billing"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
// 🔴 THIS LINE MUST EXIST
app.use("/cron/billing", billing_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`upkyp-cron running on port ${PORT}`);
});

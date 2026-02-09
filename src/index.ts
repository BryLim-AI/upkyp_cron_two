import express from "express";
import dotenv from "dotenv";
import billingRoutes from "./routes/billing";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// 🔴 THIS LINE MUST EXIST
app.use("/cron/billing", billingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`upkyp-cron running on port ${PORT}`);
});

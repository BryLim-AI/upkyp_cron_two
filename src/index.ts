import express from "express";
import billingRoutes from "./routes/billing";

const app = express();
app.use(express.json());

app.use("/cron/billing", billingRoutes);

app.listen(3000, () => {
  console.log("Cron service running on port 3000");
});

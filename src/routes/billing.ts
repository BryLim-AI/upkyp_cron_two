import { Router } from "express";
import { applyLateFees } from "../services/billing/applyLateFees.service";
import { verifyCron } from "../utils/auth";

const router = Router(); 

router.post("/apply-late-fees", verifyCron, async (_req, res) => {
  try {
    const result = await applyLateFees();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to apply late fees" });
  }
});

export default router;

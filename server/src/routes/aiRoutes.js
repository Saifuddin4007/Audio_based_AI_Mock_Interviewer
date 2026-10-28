import express from "express";
import { checkAIReadiness } from "../controllers/aiController.js";

const router = express.Router();

router.get("/ready", checkAIReadiness);

export default router;
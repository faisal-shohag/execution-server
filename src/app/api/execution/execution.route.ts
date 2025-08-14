import { handleSubmission } from "./execution.controller";
import express from 'express'
const router = express.Router();

router.post('/execution', handleSubmission);

export const executionRoute = router

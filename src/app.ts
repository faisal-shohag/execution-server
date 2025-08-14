// import cors from "cors";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { router } from "./app/routes";

const app = express()

app.use(cookieParser())
app.use(express.json())
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }))
// app.use(cors({
//     credentials: true
// }))

app.use("/api/v1", router)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Execution Backend!!"
    })
})


// app.use(globalErrorHandler)

// app.use(notFound)

export default app
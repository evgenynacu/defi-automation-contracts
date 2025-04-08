import dotenv from "dotenv"
import express, { Application } from "express"
import cors from "cors"

dotenv.config();

const app: Application = express();

app.use(express.json());

// Enable CORS for all routes
app.use(cors({
	origin: "*",
}));

app.get("/", (_, res) => {
	res.status(200).json({ status: "OK" })
})

const PORT = process.env.PORT || 8080;

app.listen(PORT, (): void => console.log(`Server is running on ${PORT}`));
// noinspection JSUnusedGlobalSymbols
export default app
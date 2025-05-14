import dotenv from "dotenv"
import express, { Application } from "express"
import cors from "cors"
import { createContext } from "../context"
import { toAddress, toHex } from "../common/types"

dotenv.config();

const app: Application = express();

app.use(express.json());

// Enable CORS for all routes
app.use(cors({
	origin: "*",
}));

createContext().then(({ dataService }) => {
	app.get("/", (_, res) => {
		res.status(200).json({ status: "OK" })
	})

	app.get("/results/morpho/:from/:vault/:marketId", async (req, res) => {
		const data = await dataService.getData({
			type: "morpho-withdraw",
			from: toAddress(req.params.from),
			vault: toAddress(req.params.vault),
			marketId: toHex(req.params.marketId)
		})

		res.status(200).json(data)
	})

	const PORT = process.env.PORT || 8080;

	app.listen(PORT, (): void => console.log(`Server is running on ${PORT}`));
})

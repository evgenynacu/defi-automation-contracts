import dotenv from "dotenv"
import express, { Application } from "express"
import cors from "cors"
import { ethers } from "ethers"
import { createCalculateExecutor } from "../common/calculate-result"
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"

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

app.get("/results/eUSDe", async (_, res) => {
	const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com")
	const ex = createCalculateExecutor(provider, "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240", "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42")
	const { result, info, faults } = await withdrawFromMorpho(ex, "0xae4571cdcad4191b9a59d1bb27a10a1b05c92c84fe423e4886d5781a30a9c8f1", 1)
	res.status(200).json({ result: result.toString(), info, faults })
})

const PORT = process.env.PORT || 8080;

app.listen(PORT, (): void => console.log(`Server is running on ${PORT}`));
// noinspection JSUnusedGlobalSymbols
export default app
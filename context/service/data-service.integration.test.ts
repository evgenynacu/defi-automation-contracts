import {DataService} from "./data-service";
import {before} from "mocha";
import {ethers} from "ethers";

describe('DataService', () => {
	let dataService: DataService

	before(() => {
		const ethRunner = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
		const arbRunner = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc")
		const plasmaRunner = new ethers.JsonRpcProvider(process.env.PLASMA_RPC_URL || "https://rpc.plasma.to")

		dataService = new DataService(ethRunner, arbRunner, plasmaRunner)
	})

	it("should load implied rate", async () => {
		const data = await dataService.getData({
			type: "pendle-implied-rate",
			market: "0x4eaa571eafcd96f51728756bd7f396459bb9b869"
		})
		console.log(data)
	})
})
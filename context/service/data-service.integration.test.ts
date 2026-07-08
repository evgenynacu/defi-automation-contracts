import {DataService} from "./data-service";
import {before} from "mocha";
import {ethers} from "ethers";
import {
	PT_srUSDE_2APR2026,
	PT_sUSDe_9APR2026,
	USDe_ADDRESS,
	USDe_PLASMA,
	USDS,
	USDT_ADDRESS
} from "../../common/addresses";

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

	it("should get USDS -> USDT rate", async () => {
		const data = await dataService.getData({
			type: "swap-rate",
			fromToken: USDS,
			toToken: USDT_ADDRESS,
			amount: 1000000000000000000000000n,
			multiplier: 1000000000000n,
		})
		console.log(data)
	})

	it("should load plasma positions", async () => {
		const data = await dataService.getData({
			type: "aave-ob-withdraw",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0xAbF51D0049cdd58F54Ffc38D4Ea370340e79855D",
			collateralToken: PT_sUSDe_9APR2026,
			debtToken: USDe_PLASMA,
			debtShare: 1,
			collateralShare: 1,
			flashLoanProvider: "insta",
		})
		console.log(data)
	})

	it("should load mainnet positions", async () => {
		const data = await dataService.getData({
			type: "aave-ob-withdraw",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			collateralToken: PT_srUSDE_2APR2026,
			debtToken: USDe_ADDRESS,
			debtShare: 1,
			collateralShare: 1,
		})
		console.log(data)
	})
})
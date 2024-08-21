import hre from "hardhat"
import { TestERC20, TestTokanGauge, TestTokanPair, TestTokanRouter, TokanDexInvestment } from "../typechain-types"
import { expect } from "chai"
import { EventLog } from "ethers"
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("TokanDexInvestment", () => {
	let primary: TestERC20
	let secondary: TestERC20
	let reward: TestERC20
	let router: TestTokanRouter
	let pair: TestTokanPair
	let gauge: TestTokanGauge
	let testing: TokanDexInvestment

	before(async () => {
		const tokenFactory = await hre.ethers.getContractFactory("TestERC20")
		primary = await tokenFactory.deploy()
		secondary = await tokenFactory.deploy()
		reward = await tokenFactory.deploy()

		const usdcRate = "1000000000000"
		const rewardRate = "50000000000000"

		const pairFactory = await hre.ethers.getContractFactory("TestTokanPair")
		pair = await pairFactory.deploy(primary, secondary, "1000000000000")
		await pair.initialize()

		const gaugeFactory = await hre.ethers.getContractFactory("TestTokanGauge")
		gauge = await gaugeFactory.deploy(reward, pair, "100000000000")

		const routerFactory = await hre.ethers.getContractFactory("TestTokanRouter")
		router = await routerFactory.deploy(pair, usdcRate, rewardRate)

		const f = await hre.ethers.getContractFactory("TokanDexInvestment")
		testing = await f.deploy()
		const config: TokanDexInvestment.TokanDexInvestmentConfigStruct = {
			router,
			gauge,
			pair,
			decimalsA: 1000000,
			stable: true,
			rewardExchangeRoute: [
				{ from: reward, to: secondary, stable: false },
				{ from: secondary, to: primary, stable: true }
			]
		}
		await testing.__TokanDexInvestment_init("NAME", "SMB", primary, secondary, reward, config)
	})

	it("Should deposit if there is nothing locked", async () => {
		const [signer] = await hre.ethers.getSigners()

		await primary.mint(signer.address, 100000000000)
		await primary.approve(testing, 100000000000)

		await deposit(10000000, false)
		// First deposit should result in the same amount as primary (but with decimals = 18)
		await expect(testing.balanceOf(signer)).to.eventually.eq("10000000000000000000")

		//then if time is not changed, then depositing value results in the same amount of liquidity
		await deposit(10000000, false)
		await expect(testing.balanceOf(signer)).to.eventually.eq("20000000000000000000")

		//if time changes, then some rewards are accumulated and rate changes
		await time.increase(1000)
		await deposit(20000000, false)
		// reward = 1000 * 10000000 * 100000000000 / 50000000000000 = 20_000_000 = 20 USDC
		// so current balance = 20 + 20. we add 20. then it's half of current total supply = 10, 30 in total
		await expect(testing.balanceOf(signer)).to.eventually.eq("30000000000000000000")
	})

	async function deposit(amount: number, log: boolean = false) {
		const result= await testing.deposit(amount)
		const receipt = await result.wait()
		if (log) {
			const logs = receipt?.logs
				.filter(it => "fragment" in it)
				.map(it => it as EventLog)
				.filter(it => it.fragment.name == "TestValue")
				.map(it => `${it.args[0]} = ${it.args[1]}`)

			console.log(logs)
		}
		const block = await receipt?.getBlock()
		return block?.timestamp
	}
})

import hre from "hardhat"
import { TestERC20, TestTokanGauge, TestTokanPair, TestTokanRouter, TokanDexInvestment } from "../typechain-types"
import { expect } from "chai"
import { type AddressLike, BigNumberish, ContractTransactionResponse, EventLog } from "ethers"
import { time } from "@nomicfoundation/hardhat-network-helpers"
import type { TypedContractMethod } from "../typechain-types/common"

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

		const [signer] = await hre.ethers.getSigners()
		await primary.mint(signer.address, "1000000000000000000")

		const usdcRate = "1000000000000"
		const rewardRate = "50000000000000"

		const pairFactory = await hre.ethers.getContractFactory("TestTokanPair")
		pair = await pairFactory.deploy(primary, secondary, "1000000000000")
		await pair.initialize()

		const gaugeFactory = await hre.ethers.getContractFactory("TestTokanGauge")
		gauge = await gaugeFactory.deploy(reward, pair, "100000000000")

		const routerFactory = await hre.ethers.getContractFactory("TestTokanRouter")
		router = await routerFactory.deploy(pair, usdcRate, rewardRate)

		console.log("deployed primary", await primary.getAddress())
		console.log("deployed secondary", await secondary.getAddress())
		console.log("deployed reward", await reward.getAddress())
		console.log("deployed pair", await pair.getAddress())
		console.log("deployed gauge", await gauge.getAddress())
		console.log("deployed router", await router.getAddress())
	})

	beforeEach(async () => {
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
		await primary.approve(testing, "1000000000000000000")
		console.log("deployed testing", await testing.getAddress())

		const [signer] = await hre.ethers.getSigners()
		await testing.claimOwner()
		await testing.setUser(signer, true)
	})

	it("should deposit if there is nothing locked", async () => {
		const [signer] = await hre.ethers.getSigners()

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

	it("should allow to withdraw everything right after deposit", async () => {
		const [signer] = await hre.ethers.getSigners()

		await deposit(10000000, false)
		// First deposit should result in the same amount as primary (but with decimals = 18)
		await expect(testing.balanceOf(signer)).to.eventually.eq("10000000000000000000")

		await expectBalanceChange(async () => {
			await testing.withdraw("10000000000000000000")
			await expectBalance(testing, signer, 0)
		}, primary, signer, 10000000)
	})

	it("should allow to withdraw partly right after deposit", async () => {
		const [signer] = await hre.ethers.getSigners()

		await deposit(10000000, false)
		// First deposit should result in the same amount as primary (but with decimals = 18)
		await expect(testing.balanceOf(signer)).to.eventually.eq("10000000000000000000")

		await expectBalanceChange(async () => {
			await testing.withdraw("3000000000000000000")
			await expectBalance(testing, signer, "7000000000000000000")
		}, primary, signer, 3000000)

		await expectBalanceChange(async () => {
			await testing.withdraw("7000000000000000000")
			await expectBalance(testing, signer, 0)
		}, primary, signer, 7000000)
	})

	it("should allow to withdraw full after some time", async () => {
		const [signer] = await hre.ethers.getSigners()

		await deposit(10000000, false)
		// First deposit should result in the same amount as primary (but with decimals = 18)
		await expect(testing.balanceOf(signer)).to.eventually.eq("10000000000000000000")

		await time.increase(200)
		await expectBalanceChange(async () => {
			const res = await testing.withdraw("10000000000000000000")
			await logTestValues(res)
			await expectBalance(testing, signer, 0)
		}, primary, signer, 12000000)
	})

	it("should allow to withdraw partly after some time", async () => {
		const [signer] = await hre.ethers.getSigners()

		await deposit(10000000, false)
		// First deposit should result in the same amount as primary (but with decimals = 18)
		await expect(testing.balanceOf(signer)).to.eventually.eq("10000000000000000000")

		await time.increase(200) //+20%
		await expectBalanceChange(async () => {
			const res = await testing.withdraw("4000000000000000000")
			await logTestValues(res)
			await expectBalance(testing, signer, "6000000000000000000")
		}, primary, signer, 4800000)

		// after withdraw left = 12 - 4.8 = 7.2
		await time.increase(200) //+20% (from initial, was no reinvestment) 6 * 1.4 = 8.4
		await expectBalanceChange(async () => {
			const res = await testing.withdraw("6000000000000000000")
			await logTestValues(res)
			await expectBalance(testing, signer, "0")
		}, primary, signer, 8400000)
	})

	it("should allow reinvest after some time", async () => {
		const [signer] = await hre.ethers.getSigners()

		await deposit(10000000, false)
		// First deposit should result in the same amount as primary (but with decimals = 18)
		await expect(testing.balanceOf(signer)).to.eventually.eq("10000000000000000000")

		await time.increase(200) //+20%
		await expect(testing.calculateValue(signer)).to.eventually.eq(12000000)
		await testing.reinvest(false, true)
		await expect(testing.calculateValue(signer)).to.eventually.eq(12000000)

		await time.increase(200) //+20%
		await expect(testing.calculateValue(signer)).to.eventually.eq(14400000)
		await testing.reinvest(false, true)
		await expect(testing.calculateValue(signer)).to.eventually.eq(14400000)
	})

	async function expectBalance(token: IERC20, address: AddressLike, balance: BigNumberish) {
		await expect(token.balanceOf(address)).to.eventually.eq(balance)
	}

	async function expectBalanceChange(fn: () => Promise<void>, token: IERC20, address: AddressLike, balance: BigNumberish, increase: boolean = true) {
		const start = await token.balanceOf(address)
		await fn()
		const end = await token.balanceOf(address)
		if (increase) {
			expect(end - start).to.eq(balance)
		} else {
			expect(start - end).to.eq(balance)
		}
	}

	async function deposit(amount: number, log: boolean = false) {
		const res = await testing.deposit(amount)
		const receipt = await res.wait()
		if (log) {
			await logTestValues(res)
		}
		const block = await receipt?.getBlock()
		return block?.timestamp
	}

	async function logTestValues(res: ContractTransactionResponse) {
		const receipt = await res.wait()
		if (receipt === null) {
			return
		}
		const logs = receipt.logs
			.filter(it => "fragment" in it)
			.map(it => it as EventLog)
			.filter(it => it.fragment.name == "TestValue")
			.map(it => `${it.args[0]} = ${it.args[1]}`)

		console.log("------logs------")
		logs.forEach(log => console.log(log))
	}
})

type IERC20 = {
	balanceOf: TypedContractMethod<[account: AddressLike], [bigint], "view">
}
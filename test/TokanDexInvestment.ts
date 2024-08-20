import hre from "hardhat"
import { TestERC20, TestTokanRouter } from "../typechain-types"

describe("TokanDexInvestment", () => {
	let primary: TestERC20
	let secondary: TestERC20
	let reward: TestERC20
	let router: TestTokanRouter

	before(async () => {
		const tokenFactory = await hre.ethers.getContractFactory("TestERC20")
		primary = await tokenFactory.deploy()
		secondary = await tokenFactory.deploy()
		reward = await tokenFactory.deploy()

		const routerFactory = await hre.ethers.getContractFactory("TestTokanRouter")
		router = await routerFactory.deploy()
	})

	it("Should allow to deposit primary token", async () => {

	})
})
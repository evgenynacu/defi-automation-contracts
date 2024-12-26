import hre from "hardhat"
import { AutomatedVault, TestStrategy } from "../typechain-types"
import { expect } from "chai"

describe("AutomatedVault TestSuite", () => {
	let vault: AutomatedVault;
	let vaultImpl: AutomatedVault;
	let testStrategy: TestStrategy;

	beforeEach(async () => {
		const [signer] = await hre.ethers.getSigners()

		const testStrategyFactory = await hre.ethers.getContractFactory("TestStrategy")
		testStrategy = await testStrategyFactory.deploy()

		const vaultFactory = await hre.ethers.getContractFactory("AutomatedVault")
		vaultImpl = await vaultFactory.deploy()

		const proxyFactory = await hre.ethers.getContractFactory("EIP173Proxy")
		const proxy = await proxyFactory.deploy(vaultImpl, signer, "0x")
		vault = vaultFactory.attach(await proxy.getAddress()) as AutomatedVault
	})

	it("should readState from test strategy", async () => {
		const data = testStrategy.interface.encodeFunctionData("init", [100])
		await vault.__Vault_init([testStrategy], [{ position: 0, callData: data }])

		const result = await vault.readState.staticCall()
		expect(Number(testStrategy.interface.decodeFunctionResult("readState", result[0]))).to.eq(101)
	})
})
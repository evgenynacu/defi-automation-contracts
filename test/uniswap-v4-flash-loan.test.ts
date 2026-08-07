import { expect } from "chai"
import { ethers } from "hardhat"
import { impersonateAccount, reset, setBalance } from "@nomicfoundation/hardhat-network-helpers"
import { config as dotenvConfig } from "dotenv"
import { resolve } from "path"

dotenvConfig({ path: resolve(__dirname, "../.env") })

import { AAVE_POOL_ADDRESS_PROVIDER, MORPHO_BLUE, UNISWAP_V4_POOL_MANAGER, USDG, ZERO_ADDRESS } from "../common/addresses"
import { ERC20_STRATEGY_INDEX, UNISWAP_V4_FLASH_LOAN_STRATEGY_INDEX } from "../common/serialize-operation"

// Aave v4 Core hub, the deepest USDG holder on mainnet
const USDG_WHALE = "0xCca852Bc40e560adC3b1Cc58CA5b55638ce826c9"

/**
 * Proves the Uniswap v4 flash loan end to end against the real PoolManager on a mainnet fork.
 *
 * The interesting part is that v4 has no flashLoan entry point: the vault takes the funds inside
 * unlock and settles them back, and the PoolManager only checks that deltas net to zero. Borrowing
 * with no inner operations is therefore the tightest possible test of take/sync/settle — if the
 * repayment path is wrong the whole unlock reverts.
 */
describe("UniswapV4FlashLoanStrategy", function () {
	this.timeout(180000)

	async function deployVault() {
		const [deployer] = await ethers.getSigners()

		const strategy = await (await ethers.getContractFactory("UniswapV4FlashLoanStrategy"))
			.deploy(UNISWAP_V4_POOL_MANAGER)
		const impl = await (await ethers.getContractFactory("AutomatedVault"))
			.deploy(MORPHO_BLUE, AAVE_POOL_ADDRESS_PROVIDER, UNISWAP_V4_POOL_MANAGER)

		const transfer = await (await ethers.getContractFactory("Erc20TransferStrategy")).deploy()

		const strategies = Array(UNISWAP_V4_FLASH_LOAN_STRATEGY_INDEX + 1).fill(ZERO_ADDRESS)
		strategies[UNISWAP_V4_FLASH_LOAN_STRATEGY_INDEX] = await strategy.getAddress()
		strategies[ERC20_STRATEGY_INDEX] = await transfer.getAddress()

		const initData = impl.interface.encodeFunctionData("__Vault_init", [strategies])
		const proxy = await (await ethers.getContractFactory("MyProxy"))
			.deploy(await impl.getAddress(), deployer.address, initData)

		return {
			vault: await ethers.getContractAt("AutomatedVault", await proxy.getAddress()),
			strategy,
			transfer,
		}
	}

	function flashLoanCall(strategy: any, token: string, amount: bigint, inner: any[] = []) {
		return {
			position: UNISWAP_V4_FLASH_LOAN_STRATEGY_INDEX,
			callData: strategy.interface.encodeFunctionData("executeFlashLoan", [token, amount, inner]),
		}
	}

	beforeEach(async () => {
		await reset(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
	})

	it("borrows USDG from the PoolManager and repays it in the same unlock", async () => {
		const { vault, strategy } = await deployVault()
		const usdg = await ethers.getContractAt("IERC20", USDG)

		const poolManagerBefore = await usdg.balanceOf(UNISWAP_V4_POOL_MANAGER)
		expect(poolManagerBefore).to.be.gt(0n)

		const amount = 100_000_000000n // 100k USDG, well inside the PoolManager's balance
		expect(poolManagerBefore).to.be.gte(amount)

		await vault.rebalance([flashLoanCall(strategy, USDG, amount)])

		// nothing paid for the loan, and the vault kept nothing
		expect(await usdg.balanceOf(UNISWAP_V4_POOL_MANAGER)).to.equal(poolManagerBefore)
		expect(await usdg.balanceOf(await vault.getAddress())).to.equal(0n)
	})

	it("reverts when asked for more than the PoolManager holds", async () => {
		const { vault, strategy } = await deployVault()
		const usdg = await ethers.getContractAt("IERC20", USDG)
		const available = await usdg.balanceOf(UNISWAP_V4_POOL_MANAGER)

		await expect(vault.rebalance([flashLoanCall(strategy, USDG, available + 1n)])).to.be.reverted
	})

	it("reverts when an inner operation spends part of the loan", async () => {
		const { vault, strategy, transfer } = await deployVault()
		const [deployer] = await ethers.getSigners()
		const amount = 100_000_000000n

		// move 1 USDG out while holding the loan, so the vault cannot settle in full
		const leak = transfer.interface.encodeFunctionData("transferTo", [USDG, deployer.address, 1_000000n])

		await expect(vault.rebalance([
			flashLoanCall(strategy, USDG, amount, [{ position: ERC20_STRATEGY_INDEX, callData: leak }]),
		])).to.be.reverted
	})

	it("settles when the vault covers what an inner operation spent", async () => {
		const { vault, strategy, transfer } = await deployVault()
		const [deployer] = await ethers.getSigners()
		const usdg = await ethers.getContractAt("IERC20", USDG)
		const vaultAddress = await vault.getAddress()

		// pre-fund the vault so the same leak is covered from its own balance
		await impersonateAccount(USDG_WHALE)
		await setBalance(USDG_WHALE, 10n ** 18n)
		await usdg.connect(await ethers.getSigner(USDG_WHALE)).transfer(vaultAddress, 1_000000n)

		const poolManagerBefore = await usdg.balanceOf(UNISWAP_V4_POOL_MANAGER)
		const leak = transfer.interface.encodeFunctionData("transferTo", [USDG, deployer.address, 1_000000n])

		await vault.rebalance([
			flashLoanCall(strategy, USDG, 100_000_000000n, [{ position: ERC20_STRATEGY_INDEX, callData: leak }]),
		])

		expect(await usdg.balanceOf(UNISWAP_V4_POOL_MANAGER)).to.equal(poolManagerBefore)
		expect(await usdg.balanceOf(vaultAddress)).to.equal(0n)
	})

	it("rejects an unlockCallback that does not come from the PoolManager", async () => {
		const { vault } = await deployVault()
		await expect(vault.unlockCallback("0x")).to.be.revertedWith("!NotRebalancing")
	})
})

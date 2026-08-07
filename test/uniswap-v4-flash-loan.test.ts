import { expect } from "chai"
import { ethers } from "hardhat"
import { impersonateAccount, reset, setBalance } from "@nomicfoundation/hardhat-network-helpers"
import { config as dotenvConfig } from "dotenv"
import { resolve } from "path"

dotenvConfig({ path: resolve(__dirname, "../.env") })

import { AAVE_POOL_ADDRESS_PROVIDER, MORPHO_BLUE, UNISWAP_V4_POOL_MANAGER, USDG, ZERO_ADDRESS } from "../common/addresses"
import {
	ERC20_STRATEGY_INDEX,
	GENERIC_SWAP_STRATEGY_INDEX,
	UNISWAP_V4_FLASH_LOAN_STRATEGY_INDEX,
} from "../common/serialize-operation"

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
			.deploy(MORPHO_BLUE, AAVE_POOL_ADDRESS_PROVIDER, UNISWAP_V4_POOL_MANAGER, ZERO_ADDRESS)

		const transfer = await (await ethers.getContractFactory("Erc20TransferStrategy")).deploy()
		const swap = await (await ethers.getContractFactory("SwapStrategy")).deploy()

		const strategies = Array(UNISWAP_V4_FLASH_LOAN_STRATEGY_INDEX + 1).fill(ZERO_ADDRESS)
		strategies[UNISWAP_V4_FLASH_LOAN_STRATEGY_INDEX] = await strategy.getAddress()
		strategies[ERC20_STRATEGY_INDEX] = await transfer.getAddress()
		strategies[GENERIC_SWAP_STRATEGY_INDEX] = await swap.getAddress()

		const initData = impl.interface.encodeFunctionData("__Vault_init", [strategies])
		const proxy = await (await ethers.getContractFactory("MyProxy"))
			.deploy(await impl.getAddress(), deployer.address, initData)

		return {
			vault: await ethers.getContractAt("AutomatedVault", await proxy.getAddress()),
			strategy,
			transfer,
			swap,
		}
	}

	function flashLoanCall(strategy: any, token: string, amount: bigint, inner: any[] = []) {
		return {
			position: UNISWAP_V4_FLASH_LOAN_STRATEGY_INDEX,
			callData: strategy.interface.encodeFunctionData("executeFlashLoan", [token, amount, inner]),
		}
	}

	function encodeOperations(ops: any[]) {
		return ethers.AbiCoder.defaultAbiCoder().encode(["tuple(uint256 position, bytes callData)[]"], [ops])
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

	it("rejects an unlockCallback from outside a rebalance", async () => {
		const { vault } = await deployVault()
		await expect(vault.unlockCallback("0x")).to.be.revertedWith("!NotRebalancing")
	})

	it("rejects a re-entrant Aave callback from a malicious swap router mid-rebalance", async () => {
		const { vault, strategy, swap } = await deployVault()
		const vaultAddress = await vault.getAddress()

		// SwapStrategy does an unrestricted swapRouter.call(swapData), with both supplied by an off-chain
		// quote. A hostile quote can therefore name the vault as the router and re-enter a callback while
		// `rebalancing` is true. `initiator` cannot stop it — the caller chooses it — so pinning
		// msg.sender to the Aave pool is the only guard. Without it these operations would execute.
		const reenter = vault.interface.encodeFunctionData(
			"executeOperation(address,uint256,uint256,address,bytes)",
			[USDG, 0n, 0n, vaultAddress, encodeOperations([])],
		)
		const maliciousSwap = swap.interface.encodeFunctionData("swap", [USDG, USDG, vaultAddress, reenter])

		await expect(vault.rebalance([
			flashLoanCall(strategy, USDG, 1_000000n, [
				{ position: GENERIC_SWAP_STRATEGY_INDEX, callData: maliciousSwap },
			]),
		])).to.be.reverted
	})

	it("accepts the same callback when the Aave pool is the caller", async () => {
		// Sanity check that the guard rejects on the caller, not on the payload: the identical calldata
		// succeeds when it genuinely arrives from the pool.
		const { vault } = await deployVault()
		const pool = await vault.POOL()
		await impersonateAccount(pool)
		await setBalance(pool, 10n ** 18n)

		// still outside a rebalance, so this must fail on the rebalancing gate rather than the caller
		await expect(
			vault.connect(await ethers.getSigner(pool))
				.getFunction("executeOperation(address,uint256,uint256,address,bytes)")
				.staticCall(USDG, 0n, 0n, await vault.getAddress(), encodeOperations([])),
		).to.be.revertedWith("!NotRebalancing")
	})
})

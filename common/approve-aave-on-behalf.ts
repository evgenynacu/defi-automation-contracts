import { ethers, Signer } from "ethers"
import { address } from "./types"
import { getAaveDataProvider } from "./get-aave-addresses"
import { IPoolDataProvider__factory, IERC20__factory } from "../typechain-types"

const CREDIT_DELEGATION_ABI = [
	"function approveDelegation(address delegatee, uint256 amount) external",
	"function borrowAllowance(address fromUser, address toUser) external view returns (uint256)",
]

const MIN_ALLOWANCE = ethers.MaxUint256 / 2n

/**
 * Approve an AutomatedVault to manage the signer's Aave position via AaveOnBehalfStrategy.
 *
 * For each collateral: approves vault to transferFrom the signer's aTokens (needed for withdraw).
 * For each debt: approves credit delegation on the variable debt token to the vault (needed for borrow).
 *
 * Skips approvals that are already sufficient. Does nothing if all permissions are already granted.
 *
 * @param signer    The user whose Aave position will be managed
 * @param vault     The AutomatedVault address that will execute AaveOnBehalfStrategy
 * @param collaterals  Underlying collateral token addresses (e.g. WETH, sUSDe)
 * @param debts        Underlying debt token addresses (e.g. USDC, USDe)
 */
export async function approveAaveOnBehalf(
	signer: Signer,
	vault: address,
	collaterals: address[],
	debts: address[],
) {
	const { chainId } = await signer.provider!.getNetwork()
	const dataProvider = IPoolDataProvider__factory.connect(getAaveDataProvider(chainId), signer)
	const signerAddress = await signer.getAddress()

	let approvalsSent = 0

	for (const collateral of collaterals) {
		const [aTokenAddress] = await dataProvider.getReserveTokensAddresses(collateral)
		const aToken = IERC20__factory.connect(aTokenAddress, signer)

		const allowance = await aToken.allowance(signerAddress, vault)
		if (allowance < MIN_ALLOWANCE) {
			console.log(`Approving aToken ${aTokenAddress} for vault ${vault}`)
			const tx = await aToken.approve(vault, ethers.MaxUint256)
			await tx.wait()
			approvalsSent++
		}
	}

	for (const debt of debts) {
		const [, , variableDebtTokenAddress] = await dataProvider.getReserveTokensAddresses(debt)
		const debtToken = new ethers.Contract(variableDebtTokenAddress, CREDIT_DELEGATION_ABI, signer)

		const allowance: bigint = await debtToken.borrowAllowance(signerAddress, vault)
		if (allowance < MIN_ALLOWANCE) {
			console.log(`Approving credit delegation on ${variableDebtTokenAddress} for vault ${vault}`)
			const tx = await debtToken.approveDelegation(vault, ethers.MaxUint256)
			await tx.wait()
			approvalsSent++
		}
	}

	if (approvalsSent === 0) {
		console.log("All approvals already granted, nothing to do")
	} else {
		console.log(`Sent ${approvalsSent} approval transaction(s)`)
	}
}

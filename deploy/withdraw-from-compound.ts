import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { executeStrategy, getSignerAddress, getVaultAddress } from "./execute-strategy"
import { address } from "./types"
import { ContractTransactionResponse } from "ethers"

const multiplier = 10000000

export async function withdrawFromCompound(hre: HardhatRuntimeEnvironment, cometAddress: address, collateralToken: address, share: number, estimateOnly: true): Promise<bigint>
export async function withdrawFromCompound(hre: HardhatRuntimeEnvironment, cometAddress: address, collateralToken: address, share: number, estimateOnly: false): Promise<ContractTransactionResponse>

/**
 * Withdraw part of the Compound positin
 * @param hre
 * @param cometAddress
 * @param collateralToken
 * @param share number from 0 to 1 (part of the position to withdraw)
 * @param estimateOnly only estimate output, do not execute any tx
 */
export async function withdrawFromCompound(hre: HardhatRuntimeEnvironment, cometAddress: address, collateralToken: address, share: number, estimateOnly: boolean) {
	const vaultAddress = await getVaultAddress(hre)

	const comet = await ethers.getContractAt("IComet", cometAddress)
	const baseToken = await comet.baseToken()

	const from = await getSignerAddress()
	const collateralBalance = await comet.collateralBalanceOf(from, collateralToken)
	const totalDebt = await comet.borrowBalanceOf(from)

	console.log("total collateral: ", collateralBalance, "total debt: ", totalDebt)

	const debtToWithdraw = totalDebt * BigInt(share * multiplier + 1) / BigInt(multiplier)
	const collateralToWithdraw = collateralBalance * BigInt(share * multiplier) / BigInt(multiplier)

	return await executeStrategy(vaultAddress, [
		{
			type: "morpho-flash-loan",
			token: baseToken,
			amount: debtToWithdraw,
			innerOperations: [
				{
					type: "compound-v3-repay",
					comet: cometAddress,
					amount: debtToWithdraw,
				},
				{
					type: "compound-v3-withdraw",
					comet: cometAddress,
					token: collateralToken,
					amount: collateralToWithdraw,
				},
				{
					type: "swap",
					from: collateralToken,
					to: baseToken,
					amount: collateralToWithdraw,
				},
			]
		},
		{
			type: "erc20-transfer-to-caller",
			token: baseToken,
			amount: ethers.MaxUint256
		}
	], estimateOnly)
}
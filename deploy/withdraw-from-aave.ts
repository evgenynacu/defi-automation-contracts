import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { AAVE_DATA_PROVIDER } from "./addresses"
import { executeStrategy, getVaultAddress } from "./execute-strategy"
import { ContractTransactionResponse } from "ethers"

const multiplier = 10000000

export async function withdrawFromAave(
	hre: HardhatRuntimeEnvironment,
	collateralToken: string,
	debtToken: string,
	share: number,
	estimateOnly: true,
): Promise<bigint>

export async function withdrawFromAave(
	hre: HardhatRuntimeEnvironment,
	collateralToken: string,
	debtToken: string,
	share: number,
	estimateOnly: false,
): Promise<ContractTransactionResponse>

export async function withdrawFromAave(
	hre: HardhatRuntimeEnvironment,
	collateralToken: string,
	debtToken: string,
	share: number,
	estimateOnly: boolean,
) {
	const vaultAddress = await getVaultAddress(hre, "AaveVaultProxy")

	const data = await ethers.getContractAt("IPoolDataProvider", AAVE_DATA_PROVIDER)

	const [, , totalDebt] = await data.getUserReserveData(debtToken, vaultAddress)
	const [collateralBalance] = await data.getUserReserveData(collateralToken, vaultAddress);

	console.log("total collateral: ", collateralBalance, "total debt: ", totalDebt)

	const debtToWithdraw = totalDebt * BigInt(share * multiplier + 1) / BigInt(multiplier)
	const collateralToWithdraw = collateralBalance * BigInt(share * multiplier) / BigInt(multiplier)

	return await executeStrategy(vaultAddress, [
		{
			type: "morpho-flash-loan",
			token: debtToken,
			amount: debtToWithdraw,
			innerOperations: [
				{
					type: "aave-repay",
					token: debtToken,
					amount: debtToWithdraw,
				},
				{
					type: "aave-withdraw",
					amount: collateralToWithdraw,
				},
				{
					type: "swap",
					from: collateralToken,
					to: debtToken,
					amount: collateralToWithdraw,
				},
			]
		},
		{
			type: "erc20-transfer-to-caller",
			token: debtToken,
			amount: ethers.MaxUint256
		}
	], estimateOnly)
}

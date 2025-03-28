import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { AAVE_DATA_PROVIDER } from "./addresses"
import { executeStrategy } from "./execute-strategy"
import { address } from "./types"

const multiplier = 10000000

export async function withdrawFromAave(
	hre: HardhatRuntimeEnvironment,
	collateralToken: string,
	debtToken: string,
	share: number
) {
	const deployment = await hre.deployments.getOrNull("AaveVaultProxy")
	if (deployment === undefined || deployment === null) {
		throw new Error("Vault not deployed")
	}

	const data = await ethers.getContractAt("IPoolDataProvider", AAVE_DATA_PROVIDER)

	const [, , totalDebt] = await data.getUserReserveData(debtToken, deployment.address)
	const [collateralBalance] = await data.getUserReserveData(collateralToken, deployment.address);

	console.log("total collateral: ", collateralBalance, "total debt: ", totalDebt)

	const debtToWithdraw = totalDebt * BigInt(share * multiplier + 1) / BigInt(multiplier)
	const collateralToWithdraw = collateralBalance * BigInt(share * multiplier) / BigInt(multiplier)

	await executeStrategy(deployment.address as address, [
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
	])
}
//1001658714
//1001658714
//1001190395
//1001657969
//1000194932 / 1001657969
//1001657348
import { AAVE_DATA_PROVIDER } from "./addresses"
import { StrategyExecutor } from "../common/calculate-result"
import { IPoolDataProvider__factory } from "../typechain-types"
import { MaxUint256 } from "ethers"

const multiplier = 10000000

export async function withdrawFromAave<T>(
	ex: StrategyExecutor<T>,
	collateralToken: string,
	debtToken: string,
	share: number
): Promise<T> {
	const vaultAddress = await ex.getVaultAddress()
	console.log("vault address: ", vaultAddress)
	const data = IPoolDataProvider__factory.connect(AAVE_DATA_PROVIDER, ex.runner)

	const [, , totalDebt] = await data.getUserReserveData(debtToken, vaultAddress)
	const [collateralBalance] = await data.getUserReserveData(collateralToken, vaultAddress);

	console.log("total collateral: ", collateralBalance, "total debt: ", totalDebt)

	const debtToWithdraw = totalDebt * BigInt(share * multiplier + 1) / BigInt(multiplier)
	const collateralToWithdraw = collateralBalance * BigInt(share * multiplier) / BigInt(multiplier)

	return ex.execute([
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
			amount: MaxUint256
		}
	])
}

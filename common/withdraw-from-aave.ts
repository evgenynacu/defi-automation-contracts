import { AAVE_DATA_PROVIDER } from "./addresses"
import { StrategyExecutor } from "./calculate-result"
import { IPoolDataProvider__factory } from "../typechain-types"
import { MaxUint256 } from "ethers"
import { getDecimals } from "./decimals"
import { getAaveHealthFactor } from "./get-aave-health-factor"

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

	const result = await ex.execute([
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
	const hf = await getAaveHealthFactor(ex.runner, vaultAddress)
	return {
		...result,
		hf: hf.result,
		debt: Number(totalDebt) / (10 ** getDecimals(debtToken)),
		collateral: Number(collateralBalance) / (10 ** getDecimals(collateralToken)),
	}
}

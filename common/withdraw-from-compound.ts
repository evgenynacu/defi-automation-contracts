import { address } from "./types"
import { StrategyExecutor } from "./calculate-result"
import { IComet__factory } from "../typechain-types"
import { MaxUint256 } from "ethers"
import { getDecimals } from "./decimals"

const multiplier = 10000000

/**
 * Withdraw part of the Compound positin
 * @param ex
 * @param cometAddress
 * @param collateralToken
 * @param share number from 0 to 1 (part of the position to withdraw)
 */
export async function withdrawFromCompound<T>(ex: StrategyExecutor<T>, cometAddress: address, collateralToken: address, share: number): Promise<T> {
	const comet = IComet__factory.connect(cometAddress, ex.runner)
	const baseToken = await comet.baseToken()

	const from = await ex.getFrom()
	const collateralBalance = await comet.collateralBalanceOf(from, collateralToken)
	const totalDebt = await comet.borrowBalanceOf(from)

	console.log("total collateral: ", collateralBalance, "total debt: ", totalDebt)

	const debtToWithdraw = totalDebt * BigInt(share * multiplier + 1) / BigInt(multiplier)
	const collateralToWithdraw = collateralBalance * BigInt(share * multiplier) / BigInt(multiplier)

	const result = await ex.execute([
		{
			type: "morpho-flash-loan",
			token: baseToken,
			amount: debtToWithdraw,
			innerOperations: [
				{
					type: "compound-v3-repay",
					comet: cometAddress,
					amount: debtToWithdraw,
					onBehalfOf: from,
				},
				{
					type: "compound-v3-withdraw",
					comet: cometAddress,
					token: collateralToken,
					amount: collateralToWithdraw,
					onBehalfOf: from,
				},
				{
					type: "swap",
					from: collateralToken,
					to: baseToken,
					amount: collateralToWithdraw,
					txOrigin: from,
				},
			]
		},
		{
			type: "erc20-transfer-to",
			token: baseToken,
			amount: MaxUint256,
			to: from,
		}
	])

	return {
		...result,
		debt: Number(totalDebt) / (10 ** getDecimals(baseToken)),
		collateral: Number(collateralBalance) / (10 ** getDecimals(collateralToken)),
	}
}
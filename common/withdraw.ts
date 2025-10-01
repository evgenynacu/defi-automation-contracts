import {StrategyExecutor} from "./calculate-result"
import {ContractRunner, MaxUint256} from "ethers"
import {getDecimals} from "./decimals"
import {Lending} from "./lending"
import {PriceOracle__factory} from "../typechain-types"
import {address} from "./types"

export type WitdrawRequest<T> = {
	ex: StrategyExecutor<T>,
	lending: Lending,
	debtShare?: number,
	collateralShare?: number,
	recipient?: address,
	amount?: bigint,
}

export async function withdraw<T>({ex, lending, debtShare, collateralShare, recipient, amount}: WitdrawRequest<T>): Promise<T> {

	const from = await ex.getFrom()

	const {
		debt,
		collateral,
		totalDebt,
		totalCollateral,
		debtToRepay,
		repayOperation,
		getWithdrawOperation,
		collateralToWithdraw,
		getHealthFactor,
	} = await lending.initWithdraw(ex, debtShare || 1, collateralShare || debtShare || 1)

	console.log("totalDebt", totalDebt, "totalCollateral", totalCollateral)
	const posValue = await getPosValue("0x56f8Df17564Fe3C0644f62CA50a4E913c188eD5d", ex.runner, collateral, totalCollateral, debt, totalDebt)
	const posSyValue = await getPosValue("0x60Cc2Da68f99746Fe1Bf8e5D40234A5FD4D2Ea11", ex.runner, collateral, totalCollateral, debt, totalDebt)

	const result = await ex.execute([
		{
			type: "morpho-flash-loan",
			token: debt,
			amount: debtToRepay,
			innerOperations: [
				repayOperation,
				getWithdrawOperation(collateralToWithdraw),
				{
					type: "swap",
					from: collateral,
					to: debt,
					amount: collateralToWithdraw,
					txOrigin: from,
				},
			]
		},
		{
			type: "erc20-transfer-to",
			token: debt,
			amount: amount || MaxUint256,
			to: recipient || from,
		}
	])
	const hf = await getHealthFactor()
	return {
		...result,
		hf,
		posValue: posValue == 0 ? undefined : posValue,
		posSyValue: posSyValue == 0 ? undefined : posSyValue,
		debt: Number(totalDebt) / (10 ** getDecimals(debt)),
		collateral: Number(totalCollateral) / (10 ** getDecimals(collateral)),
	}
}

async function getPosValue(oracle: address, runner: ContractRunner, collateral: address, totalCollateral: bigint, debt: address, totalDebt: bigint) {
	const priceOracle = PriceOracle__factory.connect(oracle, runner)
	let posValue = 0
	try {
		const [collateralValue, debtValue] = await Promise.all([
			priceOracle.getUsdValue(collateral, totalCollateral),
			priceOracle.getUsdValue(debt, totalDebt),
		])
		posValue = Number(collateralValue - debtValue) / (10 ** 8)
		if (process.env.DEBUG_VALUE) {
			console.log("posValue", posValue)
		}
	} catch (e) {
		if (process.env.DEBUG_VALUE) {
			console.error("Failed to get price", e)
		}
	}
	return posValue
}
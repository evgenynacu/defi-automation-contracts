import { StrategyExecutor } from "./calculate-result"
import { verifyAllowance } from "./verify-allowance"
import { MaxUint256 } from "ethers"
import { Lending } from "./lending"

export async function deposit<T>(
	ex: StrategyExecutor<T>,
	lending: Lending,
	amount: bigint,
	leverage: number,
) {
	const vaultAddress = await ex.getVaultAddress()
	const from = await ex.getFrom()

	console.log("deposit1", amount, leverage)
	const { debt, collateral, getSupplyOperation, getBorrowOperation } = await lending.initDeposit(ex)

	await verifyAllowance(ex.runner, debt, amount, vaultAddress)
	const flashLoanAmount = amount * BigInt(Math.floor((leverage - 1) * 10000)) / BigInt(10000)

	return ex.execute([
		{
			type: "erc20-transfer-from",
			token: debt,
			amount: amount,
			from,
		},
		{
			type: "morpho-flash-loan",
			token: debt,
			amount: flashLoanAmount,
			innerOperations: [
				{
					type: "swap",
					from: debt,
					to: collateral,
					amount: flashLoanAmount + amount,
					txOrigin: from,
				},
				getSupplyOperation(MaxUint256),
				getBorrowOperation(flashLoanAmount),
			]
		}
	])

}

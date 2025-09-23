import {Deposit, Lending, Withdraw} from "../lending"
import {address, toAddress} from "../types";
import {StrategyExecutor} from "../calculate-result";
import {IEVault2__factory} from "../../typechain-types";
import {InnerStrategyOperation} from "../serialize-operation";

export class Euler implements Lending {
	constructor(
		private readonly collateralVault: address,
		private readonly debtVault: address,
		private readonly accountId: number,
		private readonly onBehalfOf?: address,
	) {
	}

	async initDeposit(ex: StrategyExecutor<any>): Promise<Deposit> {
		const collateralVaultAddress = this.collateralVault
		const collateralVault = IEVault2__factory.connect(collateralVaultAddress, ex.runner)
		const debtVaultAddress = this.debtVault;
		const debtVault = IEVault2__factory.connect(debtVaultAddress, ex.runner)
		const onBehalfOf = xorSubAccountAddress(this.onBehalfOf || await ex.getFrom(), this.accountId)
		const [debt, collateral] = await Promise.all([
			debtVault.asset(),
			collateralVault.asset(),
		])

		return {
			debt: toAddress(debt),
			collateral: toAddress(collateral),
			getBorrowOperation(amount: bigint): InnerStrategyOperation {
				return {
					type: "euler-borrow",
					vault: debtVaultAddress,
					onBehalfOf,
					amount,
				}
			},
			getSupplyOperation(amount: bigint): InnerStrategyOperation {
				return {
					type: "euler-supply",
					vault: collateralVaultAddress,
					onBehalfOf,
					amount,
				}
			}
		}
	}

	async initWithdraw(ex: StrategyExecutor<any>, debtShare: number, collateralShare: number): Promise<Withdraw> {
		const collateralVaultAddress = this.collateralVault
		const collateralVault = IEVault2__factory.connect(collateralVaultAddress, ex.runner)
		const debtVaultAddress = this.debtVault;
		const debtVault = IEVault2__factory.connect(debtVaultAddress, ex.runner)
		const onBehalfOf = xorSubAccountAddress(this.onBehalfOf || await ex.getFrom(), this.accountId)

		const [collateral, debt, collateralShares, debtAssets] = await Promise.all([
			collateralVault.asset(),
			debtVault.asset(),
			collateralVault.balanceOf(onBehalfOf),
			debtVault.debtOf(onBehalfOf),
		])
		const collateralAssets = await collateralVault.convertToAssets(collateralShares)

		const debtToRepay = debtAssets * BigInt(Math.floor(debtShare * multiplier)) / BigInt(multiplier)
		const collateralToWithdraw = collateralAssets * BigInt(Math.floor(collateralShare * multiplier - 1)) / BigInt(multiplier)

		return {
			debt: toAddress(debt),
			collateral: toAddress(collateral),
			totalDebt: debtAssets,
			totalCollateral: collateralAssets,
			collateralToWithdraw,
			debtToRepay,
			getWithdrawOperation(amount: bigint): InnerStrategyOperation {
				return {
					type: "euler-withdraw",
					vault: collateralVaultAddress,
					onBehalfOf,
					amount,
				}
			},
			repayOperation: {
				type: "euler-repay",
				vault: debtVaultAddress,
				onBehalfOf,
				amount: debtToRepay,
			},
			async getHealthFactor(): Promise<number> {
				const [collateralValue, debtValue] = await debtVault.accountLiquidity(onBehalfOf, true)
				return Number(collateralValue * BigInt(multiplier) / debtValue) / multiplier
			}
		}
	}
}

export function xorSubAccountAddress(baseAddress: string, accountId: number | bigint | string): string {
	if (!/^0x[0-9a-fA-F]{40}$/.test(baseAddress)) {
		throw new Error("baseAddress должен быть в формате 0x + 40 hex-символов");
	}

	const mask160 = (1n << 160n) - 1n;

	const addr = BigInt(baseAddress) & mask160;

	let id: bigint;
	if (typeof accountId === "bigint") {
		id = accountId;
	} else if (typeof accountId === "number") {
		if (!Number.isInteger(accountId) || accountId < 0) {
			throw new Error("accountId должен быть неотрицательным целым числом");
		}
		id = BigInt(accountId);
	} else {
		id = accountId.startsWith("0x") ? BigInt(accountId) : BigInt(accountId);
	}

	const x = (addr ^ (id & mask160)) & mask160;
	return "0x" + x.toString(16).padStart(40, "0");
}

const multiplier = 1000000

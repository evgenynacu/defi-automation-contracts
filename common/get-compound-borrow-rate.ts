import { type BlockTag, Contract, type ContractRunner } from "ethers"
import { address } from "./types"

// Compound III accrues per second against a 365-day year.
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60

const cometAbi = [
	"function baseToken() view returns (address)",
	"function getUtilization() view returns (uint256)",
	"function getBorrowRate(uint256 utilization) view returns (uint64)",
	"function getSupplyRate(uint256 utilization) view returns (uint64)",
	"function totalBorrow() view returns (uint256)",
	"function totalSupply() view returns (uint256)",
] as const

/**
 * Current borrow rate on a Compound III (Comet) market.
 *
 * Comet prices the rate from utilization alone, and the rate is per second scaled by 1e18, same as
 * Morpho's. Reported as exp(apr) - 1 so both protocols publish one convention into one gauge.
 *
 * That figure is exact for Morpho, which really does apply a Taylor expansion of exp, but it is an
 * upper bound for Comet: accrueInternal compounds discretely at each state-changing interaction, so
 * continuous compounding overstates it by however long the market sits idle — about 19bp at the
 * rates seen here. `borrowApr` carries the simple rate for anyone who needs the exact figure, and is
 * also what Compound's UI quotes.
 *
 * Note this is the gross rate. The site headlines a net figure with COMP rewards already subtracted,
 * so this reads higher than the website for a market that is still distributing.
 */
export async function getCompoundBorrowRate(
	runner: ContractRunner,
	comet: address,
	blockTag: BlockTag = "latest",
) {
	const market = new Contract(comet, cometAbi, runner)

	// "latest" resolves independently for every call, so utilization could be read from one block and
	// the totals from the next — a stored row whose utilization and totals describe different states.
	// Pinning a block number once makes the whole reading a single snapshot.
	const block = blockTag === "latest" ? await runner.provider!.getBlockNumber() : blockTag

	const utilization: bigint = await market.getUtilization({ blockTag: block })
	const [borrowRate, supplyRate, totalBorrow, totalSupply] = await Promise.all([
		market.getBorrowRate(utilization, { blockTag: block }) as Promise<bigint>,
		market.getSupplyRate(utilization, { blockTag: block }) as Promise<bigint>,
		market.totalBorrow({ blockTag: block }) as Promise<bigint>,
		market.totalSupply({ blockTag: block }) as Promise<bigint>,
	])

	const apr = Number(borrowRate) / 1e18 * SECONDS_PER_YEAR

	return {
		id: `compound-borrow-rate-${comet}`,
		result: (Math.exp(apr) - 1) * 100,
		borrowApr: apr * 100,
		supplyApy: (Math.exp(Number(supplyRate) / 1e18 * SECONDS_PER_YEAR) - 1) * 100,
		utilization: Number(utilization) / 1e18 * 100,
		totalBorrow: totalBorrow.toString(),
		totalSupply: totalSupply.toString(),
	}
}

/**
 * Where a strategy sources its flash loan.
 *
 * - morpho  — free, but only where Morpho Blue holds the token
 * - insta   — Instadapp aggregator, only where it is deployed
 * - uni-v4  — Uniswap v4 PoolManager. Free: take and settle of the same amount inside one unlock nets
 *             to zero and fees apply only to swaps. Size is the PoolManager's whole balance of the
 *             token, pooled across every v4 pool, which is often the deepest free source.
 */
export type FlashLoanProvider = "morpho" | "insta" | "uni-v4"

export type FlashLoanOperationType = `${FlashLoanProvider}-flash-loan`

export function toFlashLoanOperation(provider: FlashLoanProvider = "morpho"): FlashLoanOperationType {
	return `${provider}-flash-loan`
}

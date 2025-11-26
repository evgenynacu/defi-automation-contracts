import {address} from "./types";
import {testSwap} from "./test-swap";

/**
 *  Tries to swap fromToken to toToken and back
 * @param fromToken
 * @param amount
 * @param toToken
 * @return share of returned amount (so we can calculate deposit/withdraw losses)
 */
export async function testSwapAndBack(
	fromToken: address,
	amount: bigint,
	toToken: address,
): Promise<number> {
	console.log("Trying to swap fromToken to toToken", amount)
	const toTokenAmount = await testSwap(fromToken, amount, toToken)
	console.log("Trying to swap toToken to fromToken", toTokenAmount)
	const fromTokenAmount = await testSwap(toToken, toTokenAmount, fromToken)
	return 1 - Number(1000000000n * fromTokenAmount / amount) / 1000000000
}
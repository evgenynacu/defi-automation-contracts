import { sleep } from "./sleep"
import { CalculateResult } from "../common/calculate-result"

export async function estimateOutput(waitTimeMs: number, fn: () => Promise<CalculateResult>, intervalMs: number = 10000) {
	console.log("Estimating output")

	const now = Date.now()
	const maxTime = now + waitTimeMs

	let minResult = BigInt(2) ** BigInt(256)
	let maxResult = 0n
	while (true) {
		try {
			const { result } = await fn()
			if (result < minResult) {
				minResult = result
			}
			if (result > maxResult) {
				maxResult = result
			}
			console.log(Math.floor(Date.now() / 1000) + "," + result)
			// console.log("current: " + result, "min: " + minResult, "max: " + maxResult, "diff: " + Number(maxResult - minResult) / Number(maxResult))
		} catch (e) {
			console.warn("Unable to estimate", e)
		}
		if (Date.now() > maxTime) {
			return
		}
		await sleep(intervalMs)
	}
}
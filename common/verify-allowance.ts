import { ContractRunner, ethers } from "ethers"
import { USDT_ADDRESS } from "./addresses"
import { getSignerAddress } from "../deploy/execute-strategy"
import { IERC20__factory } from "../typechain-types"

export async function verifyAllowance(runner: ContractRunner, token: string, amount: bigint, vault: string) {
	const from = await getSignerAddress()

	const baseToken = IERC20__factory.connect(token, runner)
	const allowance = await baseToken.allowance(from, vault)
	if (allowance < amount) {
		if (process.env.DEBUG_FROM) {
			throw new Error("DEBUG_FROM is set, but vault " + vault + " is not authorized")
		}

		console.log("Allowing to spend base token")
		if (token === USDT_ADDRESS) {
			const tx = await baseToken.approve(vault, 0)
			await tx.wait()
		}
		const tx = await baseToken.approve(vault, ethers.MaxUint256)
		await tx.wait()
	}
}
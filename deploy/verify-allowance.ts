import { ethers } from "hardhat"
import { USDT_ADDRESS } from "./addresses"
import { getSignerAddress } from "./execute-strategy"

export async function verifyAllowance(token: string, amount: bigint, vault: string) {
	const from = await getSignerAddress()

	const baseToken = await ethers.getContractAt("IERC20", token)
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
	} else {
		console.log("Allowance is sufficient: ", allowance, "amount:", amount)
	}
}
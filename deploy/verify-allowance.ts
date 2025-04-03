import { ethers } from "hardhat"
import { USDT_ADDRESS } from "./addresses"

export async function verifyAllowance(token: string, amount: bigint, vault: string) {
	const [signer] = await ethers.getSigners()

	const baseToken = await ethers.getContractAt("IERC20", token)
	const allowance = await baseToken.allowance(signer.address, vault)
	if (allowance < amount) {
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
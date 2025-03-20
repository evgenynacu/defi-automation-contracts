import { ethers } from "hardhat"

export async function verifyAllowance(token: string, amount: bigint, vault: string) {
	const [signer] = await ethers.getSigners()

	const baseToken = await ethers.getContractAt("IERC20", token)
	const allowance = await baseToken.allowance(signer.address, vault)
	if (allowance < amount) {
		console.log("Allowing to spend base token")
		const tx = await baseToken.approve(vault, ethers.MaxUint256)
		await tx.wait()
	}
}
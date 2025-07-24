import { getFreeSupply } from './get-free-supply'
import { describe } from "mocha"
import { ethers } from "ethers"

describe('getFreeSupply', () => {
	it("should fetch supply for sUSDe-Jul", async () => {
		const runner = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
		const free = await getFreeSupply(runner, "0x3b3fB9C57858EF816833dC91565EFcd85D96f634", "0xDE6eF6CB4aBd3A473ffC2942eEf5D84536F8E864")
		console.log(free)
	})
})
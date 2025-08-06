import { getSupplyCaps } from './get-supply-caps'
import { describe } from "mocha"
import { ethers } from "ethers"
import { PT_sUSDe_SEP, PT_USDe_SEP } from "../../common/addresses"

describe('getSupplyCaps', () => {
	it("should fetch supply for sUSDe-SEP", async () => {
		const runner = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
		const free = await getSupplyCaps(runner, PT_sUSDe_SEP, "0x5f4a0873a3A02f7C0CB0e13a1d4362a1AD90e751")
		console.log(free)
	})

	it("should fetch supply for USDe-SEP", async () => {
		const runner = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
		const free = await getSupplyCaps(runner, PT_USDe_SEP, "0x38A5357Ce55c81add62aBc84Fb32981e2626ADEf")
		console.log(free)
	})
})
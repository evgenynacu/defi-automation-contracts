import { getCompoundHealthFactor } from './get-compound-health-factor'
import { describe } from "mocha"
import { ethers } from "ethers"

describe('getCompoundHealthFactor', () => {
	const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc")

	it("should fetch HF for my ETH wallet", async () => {
		const hf = await getCompoundHealthFactor(provider, "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07", "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E", "0x5979D7b546E38E414F7E9822514be443A4800529")
		console.log(hf)
	})

	it("should fetch HF for my BTC wallet", async () => {
		const hf = await getCompoundHealthFactor(provider, "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07", "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D", "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f")
		console.log(hf)
	})

})
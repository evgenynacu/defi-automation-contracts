import {testSwapAndBack} from "./test-swap-and-back";
import {USDC} from "./addresses";

describe("testSwapAndBack", () => {
	it("should swap stcUSD to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, 100000000000n, "0x88887bE419578051FF9F4eb6C858A951921D8888"))
	})
})
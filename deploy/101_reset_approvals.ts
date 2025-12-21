import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromCompound } from "../common/withdraw-from-compound"
import {COMET_WETH_ADDRESS, EZETH_ADDRESS, PYUSD, siUSD, stcUSD, sUSDe_ADDRESS, USDC, wsrUSD} from "../common/addresses"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => ex.execute([
		{
			type: "reset-approval",
			token: siUSD,
			spender: "0x04857184e30A1AD4B03F79379CCEf339A9E15b1F",
		},
		{
			type: "reset-approval",
			token: USDC,
			spender: "0xfB9fc1Faf53b794472CebbC0A04aa390aFb642de",
		},
		{
			type: "reset-approval",
			token: wsrUSD,
			spender: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
		},
		{
			type: "reset-approval",
			token: USDC,
			spender: "0x3f04b65Ddbd87f9CE0A2e7Eb24d80e7fb87625b5",
		},
	]))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['reset-approvals']
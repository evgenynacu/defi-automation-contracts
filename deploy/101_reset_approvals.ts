import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromCompound } from "../common/withdraw-from-compound"
import {
	COMET_WETH_ADDRESS,
	EZETH_ADDRESS,
	PYUSD,
	siUSD,
	srUSD,
	stcUSD,
	sUSDe_ADDRESS,
	USDC, WETH_ADDRESS,
	wsrUSD
} from "../common/addresses"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => ex.execute([
		{
			type: "reset-approval",
			token: srUSD,
			spender: "0x78F92Fe8a0672279BB8da3C433730067D8Cf59f9",
		},
		{
			type: "reset-approval",
			token: srUSD,
			spender: "0x5475611Dffb8ef4d697Ae39df9395513b6E947d7",
		},
		{
			type: "reset-approval",
			token: USDC,
			spender: "0x3f04b65Ddbd87f9CE0A2e7Eb24d80e7fb87625b5",
		},
		{
			type: "reset-approval",
			token: WETH_ADDRESS,
			spender: "0xA17581A9E3356d9A858b789D68B4d866e593aE94",
		}
	]))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['reset-approvals']
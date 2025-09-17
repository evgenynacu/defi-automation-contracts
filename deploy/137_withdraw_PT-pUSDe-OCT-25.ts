import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"
import {Euler} from "../common/lending/euler";
import {withdraw} from "../common/withdraw";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const accountId = 1
	const collateralVault = "0xCfC6a55Aa72DCF3755A515aE8B82552028b63D2A"
	const debtVault = "0x53AfE3343f322c4189Ab69E0D048efd154259419";

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => withdraw(ex, euler, 1))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-pUSDE-OCT-25']
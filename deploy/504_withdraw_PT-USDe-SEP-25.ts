import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromAave } from "../common/withdraw-from-aave"
import { PT_USDe_SEP, usdc } from "../common/addresses"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromAave(ex, PT_USDe_SEP, usdc, 1), "AaveSusdeJulVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-USDe-SEP-25-AAVE']
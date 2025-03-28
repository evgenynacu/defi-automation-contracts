import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromAave } from "./withdraw-from-aave"
import { sUSDe_ADDRESS, USDT_ADDRESS } from "./addresses"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await withdrawFromAave(hre, sUSDe_ADDRESS, USDT_ADDRESS, 1)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-aave-sUSDe']
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { deployNewVaultProxy } from "./deploy-new-vault-proxy"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	await deployNewVaultProxy(hre, "AaveSusdeJulVaultProxy")
	// await sendOrEstimate(hre, ex => {
	// 	return ex.execute([{
	// 		type: "aave-init",
	// 		category: 2,
	// 	}])
	// }, "AaveSusdeJulVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deploy-aave-susde-vault-proxy']

import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { deployNewVaultProxy } from "./deploy-new-vault-proxy"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	await deployNewVaultProxy(hre, "AaveVaultProxy")
	await sendOrEstimate(hre, ex => {
		return ex.execute([{
			type: "aave-init",
			category: 27,
		}])
	}, "AaveVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deploy-aave-vault']


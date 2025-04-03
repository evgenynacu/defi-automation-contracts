import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { deployNewVaultProxy } from "./deploy-new-vault-proxy"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	await deployNewVaultProxy(hre, "NewVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deploy-new-vault-proxy']

import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { AutomatedVault } from "../typechain-types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer } = await hre.getNamedAccounts();

	const deployment = await hre.deployments.get("AutomatedVault")

	const f = await hre.ethers.getContractFactory("AutomatedVault")
	const contract: AutomatedVault = f.attach(deployment.address) as AutomatedVault
	await contract.setOperator(deployer, true)
}

export default func
func.tags = ['set-operator-eth-usdc-vault']

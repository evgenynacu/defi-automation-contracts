import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { AutomatedVault } from "../typechain-types"

const usdc = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

	const deployment = await hre.deployments.get("AutomatedVault")

	const f = await hre.ethers.getContractFactory("AutomatedVault")
	const contract: AutomatedVault = f.attach(deployment.address) as AutomatedVault

	await contract.deposit(usdc, 50000000)
}

export default func
func.tags = ['deposit-eth-usdc-vault']

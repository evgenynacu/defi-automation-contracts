import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { deployStrategies } from "./deploy-strategies"
import { getImplementationAddressFromProxy } from "./get-impl-address"
import { addressesEqual } from "./addresses-equal"
import { ethers } from "hardhat"

export async function deployNewVaultProxy(hre: HardhatRuntimeEnvironment, name: string) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	console.log("deploying contracts with the account:", deployer);

	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	if (!deployment) {
		throw new Error("Vault not deployed")
	}

	const strategies = await deployStrategies(hre)

	const implAddress= await getImplementationAddressFromProxy(deployment.address)
	console.log("current implementation address is", implAddress)

	const vaultDeployment = await hre.deployments.getOrNull(name)
	if (!vaultDeployment) {
		const impl = (await ethers.getContractFactory("AutomatedVault")).interface
		const initData = impl.encodeFunctionData("__Vault_init", [strategies])

		console.log("deploying proxy vault")
		await deploy(name, {
			from: deployer,
			args: [implAddress, deployer, initData],
			log: true,
		})
	} else {
		const vaultProxy = await ethers.getContractAt("AutomatedVault", vaultDeployment.address)
		const current = await vaultProxy.getStrategies()
		if (!addressesEqual(current, strategies)) {
			console.log("setting strategies")
			await vaultProxy.setStrategies(strategies)
		}
	}
}
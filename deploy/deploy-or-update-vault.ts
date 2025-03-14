import { Deploy } from "./types"
import { AutomatedVault } from "../typechain-types"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ethers } from 'hardhat'

export async function deployVault(hre: HardhatRuntimeEnvironment, deployer: string, deploy: Deploy, strategies: string[]) {
	console.log("Strategies to initialize:", strategies);

	// Deploy vault as proxy with initialization
	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	if (deployment !== null) {
		console.log("Upgrading the vault")
		await deploy("AutomatedVault", {
			from: deployer,
			proxy: {
				execute: {
					init: {
						methodName: "__Vault_init",
						args: [strategies, []],
					},
				},
			},
			log: true
		});

		const f = await hre.ethers.getContractFactory("AutomatedVault")
		const contract: AutomatedVault = f.attach(deployment.address) as AutomatedVault
		console.log("deployment found. setting strategies", strategies)
		await contract.setStrategies(strategies)
	} else {
		const automatedVault = await deploy("AutomatedVault", {
			from: deployer,
			proxy: {
				execute: {
					init: {
						methodName: "__Vault_init",
						args: [strategies, []],
					},
				},
			},
			log: true
		});

		console.log(`AutomatedVault proxy deployed at: ${automatedVault.address}`);

		// Additional setup for the vault - just set operator
		const vaultContract = await ethers.getContractAt("AutomatedVault", automatedVault.address);

		// Set deployer as operator
		await vaultContract.setOperator(deployer, true);
		console.log(`Set ${deployer} as operator of the vault`);
	}
}
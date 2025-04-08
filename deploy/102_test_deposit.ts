import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { executeStrategy } from "./execute-strategy"
import { COMET_WETH_ADDRESS, EZETH_ADDRESS, WETH_ADDRESS } from "./addresses"
import { ethers } from "hardhat"
import { address } from "../common/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)
	const [sender] = await ethers.getSigners()

	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	if (deployment === undefined || deployment === null) {
		throw new Error("Vault not deployed")
	}

	const comet = await ethers.getContractAt("IComet", COMET_WETH_ADDRESS)
	if (await comet.hasPermission(sender.address, deployment.address)) {
		console.log("Vault already has rights to manage caller's positions")
	} else {
		console.log("Enabling vault to manage caller's positions")
		const tx = await comet.allow(deployment.address, true)
		await tx.wait()
	}

	const baseToken = await ethers.getContractAt("IERC20", WETH_ADDRESS)
	const allowance = await baseToken.allowance(sender.address, deployment.address)
	if (allowance < 12900000000000000n) {
		console.log("Allowing to spend base token")
		const tx = await baseToken.approve(deployment.address, 12900000000000000n)
		await tx.wait()
	}

	await executeStrategy(deployment.address as address, [
		{
			type: "erc20-transfer-from-caller",
			token: WETH_ADDRESS,
			amount: 12900000000000000n,
		},
		{
			type: "morpho-flash-loan",
			token: WETH_ADDRESS,
			amount: 12900000000000000n * 6n,
			innerOperations: [
				{
					type: "swap",
					from: WETH_ADDRESS,
					to: EZETH_ADDRESS,
					amount: 12900000000000000n * 7n
				},
				{
					type: "compound-v3-supply",
					comet: COMET_WETH_ADDRESS,
					token: EZETH_ADDRESS,
					amount: ethers.MaxUint256
				},
				{
					type: "compound-v3-borrow",
					comet: COMET_WETH_ADDRESS,
					amount: 12900000000000000n * 6n
				}
			]
		}])
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['test-deposit']
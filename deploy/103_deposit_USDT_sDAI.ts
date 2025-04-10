import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { executeStrategy } from "./execute-strategy"
import { MORPHO_BLUE, SDAI_ADDRESS, USDT_ADDRESS } from "../common/addresses"
import { ethers } from "hardhat"
import { address } from "../common/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)
	const [sender] = await ethers.getSigners()

	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	if (deployment === undefined || deployment === null) {
		throw new Error("Vault not deployed")
	}

	const morpho = await ethers.getContractAt("MorphoBlue", MORPHO_BLUE)
	if (await morpho.isAuthorized(sender.address, deployment.address)) {
		console.log("Vault already has rights to manage caller's positions")
	} else {
		console.log("Enabling vault to manage caller's positions")
		const tx = await morpho.setAuthorization(deployment.address, true)
		await tx.wait()
	}

	const baseToken = await ethers.getContractAt("IERC20", USDT_ADDRESS)
	const allowance = await baseToken.allowance(sender.address, deployment.address)
	const balance = 4999490087n
	if (allowance < 5000000000n) {
		console.log("Allowing to spend base token")
		const tx = await baseToken.approve(deployment.address, 5000000000n)
		await tx.wait()
	}

	await executeStrategy(deployment.address as address, [
		{
			type: "erc20-transfer-from-caller",
			token: USDT_ADDRESS,
			amount: balance,
		},
		{
			type: "morpho-flash-loan",
			token: USDT_ADDRESS,
			amount: balance * 9n,
			innerOperations: [
				{
					type: "swap",
					from: USDT_ADDRESS,
					to: SDAI_ADDRESS,
					amount: balance * 10n
				},
				{
					type: "morpho-supply",
					marketId: "0x1ca7ff6b26581fe3155f391f3960d32a033b5f7d537b1f1932b2021a6cf4f706",
					amount: ethers.MaxUint256
				},
				{
					type: "morpho-borrow",
					marketId: "0x1ca7ff6b26581fe3155f391f3960d32a033b5f7d537b1f1932b2021a6cf4f706",
					amount: balance * 9n
				}
			]
		}])
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-USDT-sDAI']
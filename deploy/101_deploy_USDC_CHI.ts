import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	console.log("deploying contracts with the account:", deployer);
	const pair = "0x1aFbC62F221bE90D82E0F4cFeeF011451942d6e1"
	const gauge = "0x0306B9A195ebeb8Bc65b35718Cb22b59DE24E5F6"
	const router = "0xA663c287b2f374878C07B7ac55C1BC927669425a"
	const chi = "0x2fc5cf65fd0a660801f119832b2158756968266d"
	const usdc = "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4"
	const tkn = "0x1a2fcb585b327fadec91f55d45829472b15f17a4"
	const decimalsA = 1000000
	const rewardExchangeRoute = [
		{ from: tkn, to: chi, stable: false },
		{ from: chi, to: usdc, stable: true },
	]

	const deployed = await deploy("TokanDexInvestment", {
		from: deployer,
		proxy: {
			execute: {
				init: {
					methodName: "__TokanDexInvestment_init",
					args: ["USDC/CHI", "USDI", usdc, chi, tkn, { router, pair, gauge, decimalsA, stable: true, rewardExchangeRoute }],
				},
			},
		},
		autoMine: true,
		log: true,
	})
}
export default func
func.tags = ['deploy-tokan', 'deploy-tokan-usdc-chi']

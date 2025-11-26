import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {getConfig} from "./config";
import {infinifiGateway, iUSD, PENDLE_ROUTER, siUSD, srUSDe_ADDRESS, sUSDe_ADDRESS, USDC} from "../common/addresses";

export async function deployStrategies(hre: HardhatRuntimeEnvironment) {
	const config = getConfig(hre.network.name)

	const erc20TransferStrategy = await deployStrategy(hre, "Erc20TransferStrategy")
	//const swapStrategy = await deployStrategy(hre, "SwapStrategy")
	const morphoFlashLoanStrategy = await deployStrategy(hre, "MorphoFlashLoanStrategy", [config.morphoBlue])
	const aaveFlashLoanStrategy = await deployStrategy(hre, "AaveFlashLoanStrategy", [config.aavePoolAddressProvider])
	const compoundV3Strategy = await deployStrategy(hre, "CompoundV3Strategy")
	const morphoStrategy = await deployStrategy(hre, "MorphoStrategy", [config.morphoBlue])
	const genericAaveStrategy = await deployStrategy(hre, "GenericAaveStrategy", [config.aavePoolAddressProvider])
	const morphoReadStrategy = await deployStrategy(hre, "MorphoReadStrategy", [config.morphoBlue])
	const pendleSwapStrategy = await deployStrategy(hre, "PendleSwapStrategy", ["0x888888888889758F76e7103c6CbF23ABbF58F946"])
	const odosSwapStrategy = await deployStrategy(hre, "OdosSwapStrategy", ["0xCf5540fFFCdC3d510B18bFcA6d2b9987b0772559"])
	const kyberSwapStrategy = await deployStrategy(hre, "KyberSwapStrategy", ["0x6131B5fae19EA4f9D964eAc0408E4408b66337b5"])
	const eulerStrategy = await deployStrategy(hre, "EulerV2Strategy", [config.evc])
	const merklStrategy = await deployStrategy(hre, "MerklStrategy", [config.merkl])
	const ethenaS4Strategy = await deployStrategy(hre, "EthenaS4Strategy", [config.ethenaS4Distributor])
	const swapStrategy = await deployStrategy(hre, "SwapStrategy")

	const strataSwapAddress = await deployStrataSwap(hre)
	const strataSwapStrategy = await deployStrategy(hre, "StrataSwapStrategy", [strataSwapAddress])
	await deployInfinifiSwap(hre)

	return [
		erc20TransferStrategy.address,    //0
		ZERO_ADDRESS,                     //1
		morphoFlashLoanStrategy.address,  //2
		aaveFlashLoanStrategy.address,    //3
		compoundV3Strategy.address,       //4
		morphoStrategy.address,           //5
		genericAaveStrategy.address,      //6
		morphoReadStrategy.address,       //7
		pendleSwapStrategy.address,       //8
		odosSwapStrategy.address,         //9
		kyberSwapStrategy.address,        //10
		eulerStrategy.address,            //11
		merklStrategy.address,            //12
		strataSwapStrategy.address,       //13
		ethenaS4Strategy.address,         //14
		swapStrategy.address,             //15
	]
}

async function deployInfinifiSwap(hre: HardhatRuntimeEnvironment) {
	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	// Deploy StrataSwap contract
	const swap = await deploy("InfinifiSwap", {
		from: deployer,
		args: [
			siUSD,
			iUSD,
			USDC,
			infinifiGateway,
		],
		log: true
	});

	console.log("InfinifiSwap deployed at:", swap.address);
	return swap.address;

}

async function deployStrataSwap(hre: HardhatRuntimeEnvironment) {
	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	// Deploy StrataSwap contract
	const swap = await deploy("StrataSwap", {
		from: deployer,
		args: [
			PENDLE_ROUTER,   // _pendleRouter
			srUSDe_ADDRESS,  // _srUSDe
			sUSDe_ADDRESS,   // _sUSDe
		],
		log: true
	});

	console.log("StrataSwap deployed at:", swap.address);
	return swap.address;
}

async function deployStrategy(hre: HardhatRuntimeEnvironment, strategyName: string, args: any[] = []) {
	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	return deploy(strategyName, {
		from: deployer,
		args,
		log: true,
	})
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {getConfig} from "./config";
import {
	infinifiGateway,
	iUSD,
	PENDLE_ROUTER, reservoirCreditEnforcer, reservoirPsm,
	rUSD,
	siUSD,
	srUSDe_ADDRESS,
	sUSDe_ADDRESS,
	USDC, wsrUSD
} from "../common/addresses";

export async function deployStrategies(hre: HardhatRuntimeEnvironment) {
	const config = getConfig(hre.network.name)

	const erc20TransferStrategy = await deployStrategy(hre, "Erc20TransferStrategy")
	//const swapStrategy = await deployStrategy(hre, "SwapStrategy")
	const morphoFlashLoanStrategy = config.morphoBlue === ZERO_ADDRESS ? ZERO_ADDRESS : (await deployStrategy(hre, "MorphoFlashLoanStrategy", [config.morphoBlue])).address
	const aaveFlashLoanStrategy = await deployStrategy(hre, "AaveFlashLoanStrategy", [config.aavePoolAddressProvider])
	const compoundV3Strategy = await deployStrategy(hre, "CompoundV3Strategy")
	const morphoStrategy = config.morphoBlue === ZERO_ADDRESS ? ZERO_ADDRESS : (await deployStrategy(hre, "MorphoStrategy", [config.morphoBlue])).address
	const genericAaveStrategy = await deployStrategy(hre, "GenericAaveStrategy", [config.aavePoolAddressProvider])
	const morphoReadStrategy = await deployStrategy(hre, "MorphoReadStrategy", [config.morphoBlue])
	// const pendleSwapStrategy = await deployStrategy(hre, "PendleSwapStrategy", ["0x888888888889758F76e7103c6CbF23ABbF58F946"])
	// const odosSwapStrategy = await deployStrategy(hre, "OdosSwapStrategy", ["0xCf5540fFFCdC3d510B18bFcA6d2b9987b0772559"])
	// const kyberSwapStrategy = await deployStrategy(hre, "KyberSwapStrategy", ["0x6131B5fae19EA4f9D964eAc0408E4408b66337b5"])
	const eulerStrategy = await deployStrategy(hre, "EulerV2Strategy", [config.evc])
	const merklStrategy = await deployStrategy(hre, "MerklStrategy", [config.merkl])
	const ethenaS4Strategy = await deployStrategy(hre, "EthenaS4Strategy", [config.ethenaS4Distributor])
	const swapStrategy = await deployStrategy(hre, "SwapStrategy")
	const resetApprovalStrategy = await deployStrategy(hre, "ResetApprovalStrategy")

	// const strataSwapAddress = await deployStrataSwap(hre)
	// const strataSwapStrategy = await deployStrategy(hre, "StrataSwapStrategy", [strataSwapAddress])
	await deployInfinifiSwap(hre)
	await deployReservoirWsrUsdZap(hre)

	return [
		erc20TransferStrategy.address,    //0
		ZERO_ADDRESS,                     //1
		morphoFlashLoanStrategy,          //2
		aaveFlashLoanStrategy.address,    //3
		compoundV3Strategy.address,       //4
		morphoStrategy,                   //5
		genericAaveStrategy.address,      //6
		morphoReadStrategy.address,       //7
		ZERO_ADDRESS,                     //8
		ZERO_ADDRESS,                     //9
		ZERO_ADDRESS,                     //10
		eulerStrategy.address,            //11
		merklStrategy.address,            //12
		ZERO_ADDRESS,                     //13
		ethenaS4Strategy.address,         //14
		swapStrategy.address,             //15
		resetApprovalStrategy.address,    //16
	]
}

async function deployInfinifiSwap(hre: HardhatRuntimeEnvironment) {
	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();
	console.log("deploying InfinifiSwap")

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

async function deployReservoirWsrUsdZap(hre: HardhatRuntimeEnvironment) {
	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();
	console.log("deploying ReservoirWsrUsdZap")

	// Deploy StrataSwap contract
	const swap = await deploy("ReservoirWsrUsdZap", {
		from: deployer,
		args: [
			USDC,
			rUSD,
			wsrUSD,
			reservoirPsm,
			reservoirCreditEnforcer,
		],
		log: true
	});

	console.log("ReservoirWsrUsdZap deployed at:", swap.address);
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
	console.log("deploying Strategy", strategyName);

	return deploy(strategyName, {
		from: deployer,
		args,
		log: true,
	})
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
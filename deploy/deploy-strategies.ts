import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {getConfig} from "./config";

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
	]
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
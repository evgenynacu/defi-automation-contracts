import { AAVE_POOL_ADDRESS_PROVIDER, MORPHO_BLUE, PT_eUSDe_AUG, sUSDe_ADDRESS } from "../common/addresses"
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function deployStrategies(hre: HardhatRuntimeEnvironment) {
	const erc20TransferStrategy = await deployStrategy(hre, "Erc20TransferStrategy")
	const swapStrategy = await deployStrategy(hre, "SwapStrategy")
	const morphoFlashLoanStrategy = await deployStrategy(hre, "MorphoFlashLoanStrategy", [MORPHO_BLUE])
	const aaveFlashLoanStrategy = await deployStrategy(hre, "AaveFlashLoanStrategy", [AAVE_POOL_ADDRESS_PROVIDER])
	const compoundV3Strategy = await deployStrategy(hre, "CompoundV3Strategy")
	const morphoStrategy = await deployStrategy(hre, "MorphoStrategy", [MORPHO_BLUE])
	const aaveUSDeStrategy = await deployStrategy(hre, "AaveStrategy", [AAVE_POOL_ADDRESS_PROVIDER, PT_eUSDe_AUG])
	const morphoReadStrategy = await deployStrategy(hre, "MorphoReadStrategy", [MORPHO_BLUE])
	return [
		erc20TransferStrategy.address,
		swapStrategy.address,
		morphoFlashLoanStrategy.address,
		aaveFlashLoanStrategy.address,
		compoundV3Strategy.address,
		morphoStrategy.address,
		aaveUSDeStrategy.address,
		morphoReadStrategy.address,
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

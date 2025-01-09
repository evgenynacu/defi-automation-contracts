import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { IUniswapV3Pool__factory } from "../typechain-types"
import { Config } from "./config"

export async function deployStrategies(
	hre: HardhatRuntimeEnvironment,
	{
		token0,
		token1,
		uniswapPool,
		nftManager,
		aavePool,
		longToken,
		shortToken
	}: Config,
) {

	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	const poolContract = IUniswapV3Pool__factory.connect(uniswapPool, hre.ethers)
	if (await poolContract.token0() !== token0) {
		throw new Error("Unexpected token token0 " + token0);
	}
	if (await poolContract.token1() !== token1) {
		throw new Error("Unexpected token token1 " + token1);
	}

	if (!((token0 === longToken && token1 === shortToken) || (token0 === shortToken && token1 === longToken))) {
		throw new Error("Short and long token incorrect");
	}

	const uniswapStrategy = await deploy("UniswapStrategy", {
		from: deployer,
		args: [uniswapPool, nftManager],
		log: true
	})

	const aaveStrategy = await deploy("AaveStrategy", {
		from: deployer,
		args: [aavePool, longToken, shortToken],
		log: true
	})

	const swapStrategy = await deploy("SwapStrategy", {
		from: deployer,
		args: [uniswapPool, 1],
		log: true
	})

	const balancesStrategy = await deploy("BalancesStrategy", {
		from: deployer,
		args: [token0, token1],
		log: true
	})
	return { uniswapStrategy, aaveStrategy, swapStrategy, balancesStrategy }
}

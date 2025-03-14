import { Deploy } from "./types"

export async function deployCompound(deployer: string, deploy: Deploy, cometAddress: string, collateralTokenAddress: string) {
	console.log("Deploying CompoundV3Strategy...");
	const compoundStrategy = await deploy("CompoundV3Strategy", {
		from: deployer,
		args: [cometAddress, collateralTokenAddress], // Using ezETH as the only collateral
		log: true,
	});
	console.log(`CompoundV3Strategy deployed at: ${compoundStrategy.address}`);
	return compoundStrategy;
}
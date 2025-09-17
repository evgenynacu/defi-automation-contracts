import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from "hardhat"
import { SyPriceOracle } from "../typechain-types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	console.log("deploying contracts with the account:", deployer);

	const res = await deploy("SyPriceOracle", {
		from: deployer,
		args: [],
		log: true
	});

	const c: SyPriceOracle = await ethers.getContractAt("SyPriceOracle", res.address)
	await c.addPTToken("0x9f56094c450763769ba0ea9fe2876070c0fd5f77", "0xa36b60a14a1a5247912584768c6e53e1a269a9f7", true, "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497")
	await c.addPTToken("0xbc6736d346a5ebc0debc997397912cd9b8fae10a", "0x6d98a2b6cdbf44939362a3e99793339ba2016af4", true, "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3")
	await c.addPTToken("0x23e60d1488525bf4685f53b3aa8e676c30321066", "0x09fa04aac9c6d1c6131352ee950cd67ecc6d4fb9", false, "0x66a1E37c9b0eAddca17d3662D6c05F4DECf3e110")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deploy-sy-price-oracle']

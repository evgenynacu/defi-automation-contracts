import { ethers } from 'hardhat'
import { Result } from 'ethers'
import { AutomatedVault } from "../typechain-types"

const COMET_REWARDS_ADDRESS = "0x1B0e765F6224C21223AeA2af16c1C46E38885a40"

export async function readEzEthState(vaultAddress: string, cometAddress: string) {
	const cometRewards = await ethers.getContractAt("CometRewards", COMET_REWARDS_ADDRESS)
	const [token, owed] = await cometRewards.getRewardOwed(cometAddress, vaultAddress)
	console.log("token", token.toString(), "owed", owed.toString())

	const raw = await readStateRaw(vaultAddress)

	let coder = ethers.AbiCoder.defaultAbiCoder()
	const decoded: Result = coder.decode(["tuple(uint256 timestamp, bytes[] states)"], raw)
	const results = (decoded[0] as Result)[1] as Result

	const compoundData = results[1]
	const parsedCompoundData = coder.decode(["tuple(uint256, uint256)"], "0x" + compoundData.substring(130))[0] as Result
	const readCompoundData = {
		collateral: BigInt(parsedCompoundData[0].toString()),
		debt: BigInt(parsedCompoundData[1].toString()),
	}
	return {
		compound: readCompoundData
	}
}

export async function readUsdsState(vaultAddress: string, cometAddress: string) {
	const cometRewards = await ethers.getContractAt("CometRewards", COMET_REWARDS_ADDRESS)
	const [token, owed] = await cometRewards.getRewardOwed(cometAddress, vaultAddress)
	console.log("token", token.toString(), "owed", owed.toString())

	const raw = await readStateRaw(vaultAddress)


	let coder = ethers.AbiCoder.defaultAbiCoder()
	const decoded: Result = coder.decode(["tuple(uint256 timestamp, bytes[] states)"], raw)
	const results = (decoded[0] as Result)[1] as Result
	const usdsData = results[0]
	const parsedUsdsData = coder.decode(["tuple(uint256, uint256, uint256)"], "0x" + usdsData.substring(130))[0] as Result
	const realUsdsData = {
		price: BigInt(parsedUsdsData[2].toString()),
	}

	const compoundData = results[1]
	const parsedCompoundData = coder.decode(["tuple(uint256, uint256)"], "0x" + compoundData.substring(130))[0] as Result
	const readCompoundData = {
		collateral: BigInt(parsedCompoundData[0].toString()),
		debt: BigInt(parsedCompoundData[1].toString()),
	}
	return {
		usds: realUsdsData,
		compound: readCompoundData
	}
}

async function readStateRaw(vaultAddress: string) {
	const vault = await ethers.getContractAt("AutomatedVault", vaultAddress) as AutomatedVault
	const ownable = await ethers.getContractAt("MyProxy", vaultAddress)
	const owner = await ownable.owner()
	const data = vault.interface.encodeFunctionData("readState")
	return await ethers.provider.call({
		to: vaultAddress,
		from: owner,
		data
	})
}
import { StrategyOperation, toOperation } from "./to-operation"
import { HasOperation } from "../typechain-types/contracts/vault/AutomatedVault"

export async function findBestSwap(operations: StrategyOperation[]): Promise<HasOperation.OperationStruct[]> {
	return Promise.all(operations.map(toOperation))
}
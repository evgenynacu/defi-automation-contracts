import { address } from "../types"

/**
 * One side of an Aave v4 position: the underlying token plus the hub the spoke sources it from.
 *
 * The hub is not optional. A spoke can list the same token more than once when it draws it from two
 * different hubs, so token alone does not identify a reserve.
 */
export type AaveV4Leg = {
	token: address
	hub: address
}

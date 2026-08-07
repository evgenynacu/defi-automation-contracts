// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// @notice Minimal subset of the Uniswap v4 PoolManager, for flash borrowing via flash accounting.
// @dev Vendored from Uniswap/v4-core. `Currency` upstream is a user-defined value type over address,
//      which is ABI-identical to address.
//
//      There is no flashLoan function in v4. Instead, inside `unlock` the caller may `take` any currency
//      and `settle` it back, and the PoolManager only requires that all deltas net to zero before unlock
//      returns. Taking and returning the same amount therefore costs nothing — fees exist only on `swap`.
//      Available size is the PoolManager's whole balance of that token, pooled across every v4 pool.
interface IPoolManager {
    // @notice Opens a lock and calls back into msg.sender via IUnlockCallback.unlockCallback.
    function unlock(bytes calldata data) external returns (bytes memory);

    // @notice Transfers `amount` of `currency` out, recording a debt against the caller.
    function take(address currency, address to, uint256 amount) external;

    // @notice Snapshots the PoolManager's balance of `currency`. Must be called before transferring in,
    //         since settle() credits the difference between the snapshot and the balance at settle time.
    function sync(address currency) external;

    // @notice Credits whatever arrived since sync() against the caller's debt.
    function settle() external payable returns (uint256 paid);
}

interface IUnlockCallback {
    function unlockCallback(bytes calldata data) external returns (bytes memory);
}

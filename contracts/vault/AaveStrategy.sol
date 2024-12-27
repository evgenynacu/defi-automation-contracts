// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "../util/StorageUtil.sol";
import {IPoolDataProvider} from "@aave/core-v3/contracts/interfaces/IPoolDataProvider.sol";

contract AaveStrategy {
    bytes32 private constant DATA_PROVIDER = "DATA_PROVIDER";

    IPool private immutable AAVE_POOL;
    IERC20 private immutable LONG_TOKEN;
    IERC20 private immutable SHORT_TOKEN;

    struct State {
        address longToken;     // token which we are long (supplied as collateral)
        uint256 longAmount;    // amount of long token supplied
        address shortToken;    // token which we are short (borrowed)
        uint256 shortAmount;   // amount of short token borrowed
    }

    constructor(address aavePool, address longToken, address shortToken) {
        AAVE_POOL = IPool(aavePool);
        LONG_TOKEN = IERC20(longToken);
        SHORT_TOKEN = IERC20(shortToken);
    }

    // ----- view functions ----- //

    function readState() external view returns (State memory) {
        IPoolDataProvider dataProvider = _readPoolDataProvider();

        // Get long token supply data
        (
            uint256 longAmount,  // currentATokenBalance - amount supplied as collateral
            ,                    // currentStableDebt
            ,                    // currentVariableDebt
            ,                    // principalStableDebt
            ,                    // scaledVariableDebt
            ,                    // stableBorrowRate
            ,                    // liquidityRate
            ,                    // stableRateLastUpdated
        // usageAsCollateralEnabled
        ) = dataProvider.getUserReserveData(address(LONG_TOKEN), address(this));

        // Get short token debt data
        (
            ,                    // currentATokenBalance
            ,                    // currentStableDebt
            uint256 shortAmount, // currentVariableDebt - amount borrowed
            ,                    // principalStableDebt
            ,                    // scaledVariableDebt
            ,                    // stableBorrowRate
            ,                    // liquidityRate
            ,                    // stableRateLastUpdated
        // usageAsCollateralEnabled
        ) = dataProvider.getUserReserveData(address(SHORT_TOKEN), address(this));

        return State({
            longToken: address(LONG_TOKEN),
            longAmount: longAmount,
            shortToken: address(SHORT_TOKEN),
            shortAmount: shortAmount
        });
    }

    // ----- init ----- //

    // @notice Initializes strategy by approving tokens to Aave pool
    function init() external {
        LONG_TOKEN.approve(address(AAVE_POOL), type(uint256).max);
        SHORT_TOKEN.approve(address(AAVE_POOL), type(uint256).max);
    }

    // ----- main strategy functions ----- //

    // @notice Deposits more long token as collateral
    function depositLong(uint256 amount) external {
        AAVE_POOL.supply(address(LONG_TOKEN), amount, address(this), 0);
    }

    // @notice Withdraws long token from collateral
    function withdrawLong(uint256 amount) external {
        AAVE_POOL.withdraw(address(LONG_TOKEN), amount, address(this));
    }

    // @notice Borrows more short token
    function borrowShort(uint256 amount) external {
        AAVE_POOL.borrow(address(SHORT_TOKEN), amount, 2, 0, address(this)); // Variable rate = 2
    }

    // @notice Repays borrowed short token
    function repayShort(uint256 amount) external {
        AAVE_POOL.repay(address(SHORT_TOKEN), amount, 2, address(this)); // Variable rate = 2
    }

    function _readPoolDataProvider() internal view returns (IPoolDataProvider) {
        return IPoolDataProvider(AAVE_POOL.ADDRESSES_PROVIDER().getAddress(DATA_PROVIDER));
    }

}
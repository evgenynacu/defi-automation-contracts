// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "../util/StorageUtil.sol";
import {IPoolDataProvider} from "@aave/core-v3/contracts/interfaces/IPoolDataProvider.sol";

contract AaveStrategy {
    using SafeERC20 for IERC20;

    bytes32 private constant DATA_PROVIDER = "DATA_PROVIDER";

    IPool private immutable AAVE_POOL;
    IERC20 private immutable COLLATERAL_TOKEN;

    constructor(IPoolAddressesProvider addressProvider, address collateralToken) {
        AAVE_POOL = IPool(addressProvider.getPool());
        COLLATERAL_TOKEN = IERC20(collateralToken);
    }

    function init(uint8 category) external {
        AAVE_POOL.setUserEMode(category);
    }

    // ----- main strategy functions ----- //

    function supplyCollateral(uint256 amount) external {
        uint256 supplyAmount;

        // If max uint is passed, supply all available tokens
        if (amount == type(uint256).max) {
            supplyAmount = COLLATERAL_TOKEN.balanceOf(address(this));
        } else {
            supplyAmount = amount;
        }

        require(supplyAmount > 0, "Amount must be greater than 0");
        _approveIfNeeded(address(COLLATERAL_TOKEN), address(AAVE_POOL), supplyAmount);
        _depositCollateral(supplyAmount);
        COLLATERAL_TOKEN.forceApprove(address(AAVE_POOL), 0);
    }

    function withdrawCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        _withdrawCollateral(amount);
    }

    function borrowDebt(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        _borrow(token, amount);
    }

    function repayDebt(address token, uint256 amount) external {
        IPoolDataProvider dataProvider = _readPoolDataProvider();
        uint borrowBalance = _getDebtAmount(dataProvider, token);
        require(borrowBalance > 0, "No borrow balance to repay");

        // If amount is max uint256, repay the full balance
        uint256 repayAmount = amount;
        if (amount == type(uint256).max) {
            repayAmount = borrowBalance;
        }

        _approveIfNeeded(token, address(AAVE_POOL), repayAmount);
        _repay(token, repayAmount);
        IERC20(token).forceApprove(address(AAVE_POOL), 0);
    }
    // ----- aave related functions ----- //

    function _getDebtAmount(IPoolDataProvider dataProvider, address token) internal view returns (uint256 shortAmount) {
        (
        ,                    // currentATokenBalance
        ,                    // currentStableDebt
            shortAmount,     // currentVariableDebt - amount borrowed
        ,                    // principalStableDebt
        ,                    // scaledVariableDebt
        ,                    // stableBorrowRate
        ,                    // liquidityRate
        ,                    // stableRateLastUpdated
        // usageAsCollateralEnabled
        ) = dataProvider.getUserReserveData(token, address(this));
    }

    function _depositCollateral(uint256 amount) internal {
        AAVE_POOL.supply(address(COLLATERAL_TOKEN), amount, address(this), 0);
    }

    function _withdrawCollateral(uint256 amount) internal {
        AAVE_POOL.withdraw(address(COLLATERAL_TOKEN), amount, address(this));
    }

    // @notice Borrows more short token
    function _borrow(address token, uint256 amount) internal {
        AAVE_POOL.borrow(token, amount, 2, 0, address(this)); // Variable rate = 2
    }

    // @notice Repays borrowed short token
    function _repay(address token, uint256 amount) internal {
        AAVE_POOL.repay(token, amount, 2, address(this)); // Variable rate = 2
    }

    function _readPoolDataProvider() internal view returns (IPoolDataProvider) {
        return IPoolDataProvider(AAVE_POOL.ADDRESSES_PROVIDER().getAddress(DATA_PROVIDER));
    }

    function _approveIfNeeded(address token, address spender, uint256 amount) internal {
        uint256 allowance = IERC20(token).allowance(address(this), spender);
        if (allowance < amount) {
            IERC20(token).forceApprove(spender, type(uint256).max);
        }
    }
}
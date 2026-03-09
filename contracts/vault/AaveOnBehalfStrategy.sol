// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolDataProvider} from "@aave/core-v3/contracts/interfaces/IPoolDataProvider.sol";

contract AaveOnBehalfStrategy {
    using SafeERC20 for IERC20;

    bytes32 private constant DATA_PROVIDER = "DATA_PROVIDER";

    IPool private immutable AAVE_POOL;

    constructor(IPoolAddressesProvider addressProvider) {
        AAVE_POOL = IPool(addressProvider.getPool());
    }

    // ----- main strategy functions ----- //

    function supplyCollateral(IERC20 collateralToken, uint256 amount, address onBehalfOf) external {
        uint256 supplyAmount;

        // If max uint is passed, supply all available tokens
        if (amount == type(uint256).max) {
            supplyAmount = collateralToken.balanceOf(address(this));
        } else {
            supplyAmount = amount;
        }

        require(supplyAmount > 0, "Amount must be greater than 0");
        _approveIfNeeded(address(collateralToken), address(AAVE_POOL), supplyAmount);
        AAVE_POOL.supply(address(collateralToken), supplyAmount, onBehalfOf, 0);
        collateralToken.forceApprove(address(AAVE_POOL), 0);
    }

    function withdrawCollateral(IERC20 collateralToken, uint256 amount, address onBehalfOf) external {
        IPoolDataProvider dataProvider = _readPoolDataProvider();
        (address aTokenAddress,,) = dataProvider.getReserveTokensAddresses(address(collateralToken));
        IERC20 aToken = IERC20(aTokenAddress);

        uint256 withdrawAmount;
        if (amount == type(uint256).max) {
            withdrawAmount = aToken.balanceOf(onBehalfOf);
        } else {
            withdrawAmount = amount;
        }

        require(withdrawAmount > 0, "Amount must be greater than 0");
        aToken.safeTransferFrom(onBehalfOf, address(this), withdrawAmount);
        AAVE_POOL.withdraw(address(collateralToken), withdrawAmount, address(this));
    }

    function borrowDebt(address token, uint256 amount, address onBehalfOf) external {
        require(amount > 0, "Amount must be greater than 0");
        AAVE_POOL.borrow(token, amount, 2, 0, onBehalfOf); // Variable rate = 2
    }

    function repayDebt(address token, uint256 amount, address onBehalfOf) external {
        IPoolDataProvider dataProvider = _readPoolDataProvider();
        uint borrowBalance = _getDebtAmount(dataProvider, token, onBehalfOf);
        require(borrowBalance > 0, "No borrow balance to repay");

        uint256 repayAmount = amount;
        if (amount == type(uint256).max) {
            repayAmount = borrowBalance;
        }

        _approveIfNeeded(token, address(AAVE_POOL), repayAmount);
        AAVE_POOL.repay(token, repayAmount, 2, onBehalfOf); // Variable rate = 2
        IERC20(token).forceApprove(address(AAVE_POOL), 0);
    }

    // ----- internal helpers ----- //

    function _getDebtAmount(IPoolDataProvider dataProvider, address token, address user) internal view returns (uint256 shortAmount) {
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
        ) = dataProvider.getUserReserveData(token, user);
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

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Investment.sol";

/// @notice Represents on-chain DEX investment (in liquidity pair)
abstract contract DexInvestment is Investment {
    IERC20 public secondary;
    IERC20 public reward;

    function __DexInvestment_init_unchained(IERC20 _secondary, IERC20 _reward) internal onlyInitializing {
        secondary = _secondary;
        reward = _reward;
    }

    /// @notice Adds liquidity to DEX pair: calculates amount to exchange, then adds liqudity on both sides
    /// @param amount Amount of primary token to deposit
    /// @return toMint Number of tokens to be minted after depositing funds
    function _deposit(uint amount) internal override returns (uint toMint) {
        emit TestValue("A", amount);
        uint dA = _calculateDeltaA(amount);
        emit TestValue("deltaA", dA);

        /// @dev B = amount of secondary tokens which are exchanged
        uint B = _exchangePrimary(dA, _getSecondaryOut(dA));
        emit TestValue("B", B);

        uint _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            toMint = amount * 10 ** 18/ _getDecimalsA();
        } else {
            (uint ownedRewards, uint unclaimedRewards) = _getAllRewards();
            emit TestValue("ownedRewards", ownedRewards);
            emit TestValue("unclaimedRewards", unclaimedRewards);

            uint totalValue = _calculateTotalValue();
            emit TestValue("total", totalValue);

            /// @dev calculating deposited assets value
            uint depositedValue = (amount - dA) + _getPrimaryOut(B);
            emit TestValue("deposited", depositedValue);
            toMint = depositedValue * totalSupply() / (totalValue - depositedValue);
        }

        /// @dev put into the liquidity pool
        _putIntoDex(amount - dA, B);
    }

    function _calculateTotalValue() internal view override returns (uint total) {
        (uint amountA, uint amountB, uint rewards) = _calculateAllAssets();
        total = amountA + _getPrimaryOut(amountB) + _getRewardValue(rewards);
    }

    /// @dev Calculates all assets owned by the contract
    function _calculateAllAssets() internal view returns (uint amountA, uint amountB, uint rewards) {
        uint ownedA = primary.balanceOf(address(this));
        uint ownedB = secondary.balanceOf(address(this));
        (uint investedA, uint investedB) = _getDexLiquidity();
        (uint ownedRewards, uint unclaimedRewards) = _getAllRewards();
        amountA = ownedA + investedA;
        amountB = ownedB + investedB;
        rewards = ownedRewards + unclaimedRewards;
    }

    /// @notice Calculates A to exchange to B to add as DEX liquidity
    /// @dev This function works under assumption that deposited liquidity is too small to change balance of reserves
    /// @dev Definitions: Ra = Reserves of A(primary), Rb = Reserves of B(secondary), X = amount, dX = X to exchange
    /// @dev P = amount out for B (if amount of A = 1) (So P = Price)
    /// @dev this holds: Ra/Rb = (A - dA) / dA * P
    /// @dev In the result dA = A * Rb / (Ra * P + Rb)
    function _calculateDeltaA(uint A) internal view returns (uint dA) {
        uint decimalsA = _getDecimalsA();
        uint P = _getSecondaryOut(decimalsA);
        (uint Ra, uint Rb) = _getReserves();
        return A * Rb / (Ra * P / decimalsA + Rb);
    }

    /// @notice Gets rewards (owned and unclaimed)
    function _getAllRewards() internal view returns (uint owned, uint unclaimed) {
        if (address(reward) == 0x0000000000000000000000000000000000000000) {
            owned = 0;
            unclaimed = 0;
        } else {
            owned = reward.balanceOf(address(this));
            unclaimed = _getRewards();
        }
    }

    /// @notice Gets reserves for both assets in the pool
    function _getReserves() internal virtual view returns (uint reserveA, uint reserveB);

    /// @notice Gets 10**decimals for primary asset
    function _getDecimalsA() internal view virtual returns (uint decimalsA);

    /// @notice Calculates how much secondary tokens will be returned if primaryAmount exchanged
    function _getSecondaryOut(uint primaryAmount) internal view virtual returns (uint secondaryAmount);

    /// @notice Calculates how much primary tokens will be returned if secondaryAmount exchanged
    function _getPrimaryOut(uint secondaryAmount) internal view virtual returns (uint primaryAmount);

    /// @notice Calculates how much primary tokens will be returned if reward exchanged
    function _getRewardValue(uint rewardAmount) internal view virtual returns (uint primaryAmount);

    /// @notice Exchanges primary token and gets secondary token
    function _exchangePrimary(uint primaryAmount, uint outMin) internal virtual returns (uint out);

    /// @notice Returns liquidity currently in the DEX Pool
    function _getDexLiquidity() internal view virtual returns (uint amountA, uint amountB);

    /// @notice Returns liquidity currently in the DEX Pool
    function _getRewards() internal view virtual returns (uint amount);

    /// @notice Adds liquidity into DEX pool
    function _putIntoDex(uint amountA, uint amountB) internal virtual returns (uint resultA, uint resultB);
}

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
        (uint dA, uint B) = _depositToDex(amount);
        toMint = _calculateToMint((amount - dA) + _getPrimaryOut(B));
    }

    /// @notice Calculates how much tokens to mint after the deposit
    function _calculateToMint(uint depositedValue) internal view returns (uint toMint) {
        uint _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            toMint = depositedValue * 10 ** 18/ _getDecimalsA();
        } else {
            uint totalValue = _calculateTotalValue();

            /// @dev calculating deposited assets value
            toMint = depositedValue * totalSupply() / (totalValue - depositedValue);
        }
    }

    // @notice Prepares withdrawal of the liquidity. Takes proportionally all values from: owned assets, invested, rewards
    function _prepareWithdraw(uint amount, uint totalSupply) internal override returns (uint readyToWithdraw) {
        uint userA = primary.balanceOf(address(this)) * amount / totalSupply;
        uint userB = secondary.balanceOf(address(this)) * amount / totalSupply;
        (uint amountA, uint amountB) = _withdrawFromDex(amount, totalSupply);

        // @dev first just sum owned A and extracted from DEX liquidity
        readyToWithdraw = userA + amountA;
        // @dev then exchange secondary to primary and add it as well
        readyToWithdraw += _exchangeSecondary(userB + amountB);

        if (address(reward) != 0x0000000000000000000000000000000000000000) {
            _receiveRewards();
            uint rewards = reward.balanceOf(address(this));
            uint userRewards = rewards * amount / totalSupply;
            readyToWithdraw += _exchangeRewards(userRewards);
        }
    }

    /// @notice Reinvests everything's owned into DEX (including rewards)
    /// @dev it does it easy way - just exchanges everything to primary first and then runs part of deposit function
    function reinvest(bool reinvestSecondary, bool reinvestRewards) external onlyUser {
        if (reinvestSecondary) {
            uint ownedB = secondary.balanceOf(address(this));
            _exchangeSecondary(ownedB);
        }

        if (reinvestRewards && address(reward) != 0x0000000000000000000000000000000000000000) {
            _receiveRewards();
            uint rewards = reward.balanceOf(address(this));

            if (rewards != 0) {
                _exchangeRewards(rewards);
            }
        }

        uint amount = primary.balanceOf(address(this));
        _depositToDex(amount);
        emit Total(_calculateTotalValue(), totalSupply());
    }

    /// @notice Calculate total value of the rewards accumulated
    function getRewardsValue() view external returns (uint) {
        uint current = reward.balanceOf(address(this));
        uint earned = _getRewards();
        return _getRewardValue(current + earned);
    }

    function _depositToDex(uint amount) internal returns (uint dA, uint B) {
        if (amount != 0) {
            dA = _calculateDeltaA(amount);

            /// @dev B = amount of secondary tokens which are exchanged
            B = _exchangePrimary(dA);

            /// @dev put into the liquidity pool
            _putIntoDex(amount - dA, B);
        } else {
            dA = 0;
            B = 0;
        }
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
    function _exchangePrimary(uint amount) internal virtual returns (uint out);

    /// @notice Exchanges secondary token and gets primary token
    function _exchangeSecondary(uint amount) internal virtual returns (uint out);

    /// @notice Exchanges secondary token and gets primary token
    function _exchangeRewards(uint amount) internal virtual returns (uint out);

    /// @notice Returns liquidity currently in the DEX Pool
    function _getDexLiquidity() internal view virtual returns (uint amountA, uint amountB);

    /// @notice Returns rewards earned already
    function _getRewards() internal view virtual returns (uint amount);

    /// @notice Receives rewards and transfers them to this smart-contract
    function _receiveRewards() internal virtual;

    /// @notice Adds liquidity into DEX pool
    function _putIntoDex(uint amountA, uint amountB) internal virtual returns (uint resultA, uint resultB);

    /// @notice Removes part of the liquidity from DEX (amount/totalSupply)
    function _withdrawFromDex(uint amount, uint totalSupply) internal virtual returns (uint amountA, uint amountB);
}

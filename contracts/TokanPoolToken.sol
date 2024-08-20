// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TokanPair.sol";
import "./TokanGauge.sol";

abstract contract TokanPoolToken is ERC20Upgradeable {
    /**
     * All assets are in
     * 1. main/secondary/rewards tokens
     * 2. pair, not put in gauge
     * 3. gauge
     * 4. accumulated reward
    **/

    TokanPair public pair;
    TokanGauge public gauge;

    IERC20 public main;
    IERC20 public secondary;
    IERC20 public reward;

    function __TokanPoolToken_init(
        TokanPair _pair
    ) external onlyInitializing {
        pair = _pair;
    }

    /// @dev Exchanges main token to secondary and adds liquidity to the pool
    function deposit(uint amount) external {


    }

    /// @dev Burns tokens, calculates amount of tokens to withdraw, exchanges everything to main token and transfers to the caller
    function withdraw(uint amount) external {
        uint _totalSupply = totalSupply();
        uint _balance = balanceOf(_msgSender());
        _burn(_msgSender(), amount);

//        (uint amount0, uint amount1, uint directly0, uint directly1) = _calculateTotalAmounts();
//        //calculating amounts to withdraw
//        uint value0 = amount0 * _balance / _totalSupply;
//        uint value1 = amount1 * _balance / _totalSupply;

        (uint rewards, uint directly) = _calculateRewards();
        uint userRewards = rewards & _balance / _totalSupply;

    }

    /// @dev Withdraws everything from the pool, exchanges all amount of secondary token to main
    /// @dev This can be done only if price in the Pool is not within safe bounds
    function safeWithdrawAll() external {

    }

    /// @dev Gets reward from the Gauge, exchanges reward to main and secondary and puts into the Pool
    function reinvestReward() external {

    }

    /// @dev Calculates the value of all assets accumulated in the contract
    function _calculateTotalValue() internal view returns (uint) {
        (uint amount0, uint amount1,,) = _calculateTotalAmounts();

        // considering that token1 is secondary. needs to be changed if it's not the case
        // amount1Exchanged - how much main token can be got after exchanging all secondary to main
        uint amount1Exchanged = pair.getAmountOut(amount1, address(secondary));

        // Calculating rewards
        (uint rewards,) = _calculateRewards();
        uint rewardsExchanged = _getRewardAmountOut(rewards);

        return amount0 + amount1Exchanged + rewardsExchanged;
    }

    function _calculateRewards() internal view returns (uint rewards, uint directly) {
        directly = reward.balanceOf(address(this));
        rewards = gauge.earned(address(this)) + directly;
    }

    /// @dev Calculates the value of main and secondary assets owned by the contract (directly or indirectly)
    function _calculateTotalAmounts() internal view returns (uint amount0, uint amount1, uint directly0, uint directly1) {
        // liquidity - total amount of Pair tokens, deposited in Gauge for this Pool
        // potentially some amount can be owned by this contract and not in the gauge, but will always put Pair tokens into the gauge, so should not happen
        uint liquidity = gauge.balanceOf(address(this));

        // _balance0, _balance1 - how much main and secondary tokens pair owns
        uint256 _balance0 = main.balanceOf(address(pair));
        uint256 _balance1 = secondary.balanceOf(address(pair));

        uint256 _totalSupply = pair.totalSupply();
        directly0 = main.balanceOf(address(this));
        directly1 = secondary.balanceOf(address(this));
        amount0 = (liquidity * _balance0) / _totalSupply + directly0;
        amount1 = (liquidity * _balance1) / _totalSupply + directly1;
    }

    /// @dev Returns the amount of main token if reward is exchanged to main
    function _getRewardAmountOut(uint amount) internal view virtual returns (uint256);

    /// @dev Exchanges amount of reward token to main token
    function _exchangeReward(uint amount) internal virtual;
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {TokanGauge} from "../interfaces/tokan/TokanGauge.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//1. есть то, сколько уже собрал чувак
//2. есть то, сколько ему начислено и оно не меняется
//3. с последнего момента ему начисляется его баланс * скорость начисления
contract TestTokanGauge is TokanGauge {
    address private reward;
    address private pair;
    // @dev how much reward is added per 1 liquidity in 1 sec
    uint private rewardRate;

    event TestValue(string name, uint value);

    struct Position {
        // @dev amount of liquidity this user has
        uint value;
        // @dev amount of reward tokens already accumulated by user
        uint accumulated;
        // @dev last update timestamp
        uint timestamp;
    }

    mapping(address account => uint256) private claimed;
    mapping(address account => Position) private positions;

    constructor(address _reward, address _pair, uint _rewardRate) {
        reward = _reward;
        pair = _pair;
        rewardRate = _rewardRate;
    }

    function getReward() external {
        //todo implement
    }

    function earned(address account) external view returns (uint256) {
        return _calculateRewards(account) - claimed[account];
    }

    // @dev calculate rewards which user can receive at the moment
    function _calculateRewards(address account) internal view returns (uint) {
        Position memory pos = positions[account];
        if (pos.timestamp == 0) {
            // @dev this means it's not initialized yet
            return 0;
        } else {
            return pos.accumulated + (block.timestamp - pos.timestamp) * rewardRate * pos.value;
        }
    }

    function deposit(uint256 amount) external {
        require(IERC20(pair).transferFrom(msg.sender, address(this), amount));

        Position storage pos = positions[msg.sender];
        if (pos.timestamp == 0) {
            // @dev then initialize
            emit TestValue("first deposit", amount);

            pos.accumulated = 0;
            pos.timestamp = block.timestamp;
            pos.value = amount;
        } else {
            emit TestValue("non-first deposit value", pos.value);
            emit TestValue("non-first deposit amount", amount);

            pos.accumulated = pos.accumulated + (block.timestamp - pos.timestamp) * rewardRate * pos.value;
            pos.timestamp = block.timestamp;
            pos.value = pos.value + amount;

            emit TestValue("non-first deposit acc", pos.accumulated);
        }
    }

    function balanceOf(address _account) external view returns (uint) {
        return positions[_account].value;
    }
}

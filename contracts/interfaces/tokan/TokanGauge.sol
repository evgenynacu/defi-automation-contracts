// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface TokanGauge is IERC20 {
    function getReward() external;
    function earned(address account) external view returns (uint256);
    function deposit(uint256 amount) external;
}

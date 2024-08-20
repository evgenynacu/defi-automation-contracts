// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("TST", "TST") {

    }

    function mint(address to, uint amount) external {
        _mint(to, amount);
    }
}

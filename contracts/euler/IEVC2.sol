// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEVC2 {
    function setAccountOperator(address account, address operator, bool authorized) external payable;

    function enableCollateral(address account, address vault) external;
    function enableController(address account, address vault) external;

    function call(
        address targetContract,
        address onBehalfOfAccount,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory);
}


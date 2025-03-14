// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

// @notice Simple contract which has owner and operators. Only owner can set operators
// @dev should be used with EIP173Proxy (it reads owner from the same storage slot)
abstract contract RolesUpgradeable is Initializable, ContextUpgradeable {
    mapping(address => bool) private operators;

    function __RolesUpgradeable_init_unchained() internal {

    }

    // @dev functions which can be only called by the operators
    modifier onlyOperator() {
        require(_isOperator(), "NotOperator");
        _;
    }

    modifier operatorOrOwner() {
        require(_isOperator() || _msgSender() == _owner(), "NotOperatorOrOwner");
        _;
    }

    function _isOperator() internal view returns (bool) {
        return operators[_msgSender()];
    }

    function setOperator(address account, bool _operator) external onlyOwner() {
        operators[account] = _operator;
    }

    modifier onlyOwner() {
        require(_msgSender() == _owner(), "NOT_AUTHORIZED");
        _;
    }

    function _owner() internal view returns (address adminAddress) {
        assembly {
            adminAddress := sload(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103)
        }
    }
}

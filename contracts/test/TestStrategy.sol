// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {StorageUtil} from "../util/StorageUtil.sol";

contract TestStrategy {
    bytes32 private constant VALUE_SLOT = keccak256("_value");

    function readState() external returns (uint) {
        _setValue(_readValue() + 1);
        return _readValue();
    }

    function init(uint someValue) external {
        require(_readValue() == 0);
        _setValue(someValue);
    }

    function _readValue() internal view returns (uint) {
        return StorageUtil.readUintSlot(VALUE_SLOT);
    }

    function _setValue(uint _value) internal {
        StorageUtil.setUintSlot(VALUE_SLOT, _value);
    }
}

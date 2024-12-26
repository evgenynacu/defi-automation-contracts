// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

library DelegateCall {
    function doDelegateCall(address _address, bytes memory _data) internal returns (bytes memory) {
        (bool success, bytes memory result) = _address.delegatecall(_data);
        if (!success) {
            string memory errorMessage = abi.decode(result, (string));
            revert(errorMessage);
        }
        return result;
    }
}

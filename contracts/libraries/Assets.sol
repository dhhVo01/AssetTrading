// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

// import "./Strings.sol";

library Assets {
    // using Strings for *;
    enum Type {
        ETH,
        ERC20,
        ERC721
    }
    struct Detail {
        address _asset_address;
        uint256 _amount;
        uint256 _token_id;
        Type _type;
    }
    struct Pair {
        uint256 _id;
        address _owner;
        uint256 _price;
        Detail _asset_out;
        Detail _asset_in;
        bool _is_finished;
    }
    
}
// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./interfaces/IERC721.sol";
import "./interfaces/IAssetTrading.sol";

import "./libraries/Counters.sol";
import "./libraries/Assets.sol";
import "./libraries/SafeERC20.sol";

// Author: @dangvhh
contract AssetTrading is IAssetTrading {

    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    
    Counters.Counter private counterPairActive;

    uint256 public constant PRICE_DECIMAL = 10**6;

    Assets.Pair[] public pairs;

    mapping(address => uint256[]) public pairIdsByOwners; // address owner => uint256[] pairIds

    uint private unlocked = 1;

    modifier lock() {
        require(unlocked == 1, "AssetTrading: LOCK");
        unlocked = 0;
        _;
        unlocked = 1;
    }
    modifier askIsActive(uint256 id){
        require(id < pairs.length, "AssetTrading: ID_OUT_RANGE");
        require(pairs[id]._is_finished == false, "AssetTrading: ASK_FINISHED");
        _;
    }
    modifier validAmount(uint256 amount) {
        require(amount > 0, "AssetTrading: INVALID_AMOUNT");
        _;
    }
    modifier validAddress(address addr) {
        require(addr != address(0), "AssetTrading: ZERO_ADDRESS");
        _;
    }


    event AskCreated(address indexed owner, uint256 indexed id, address assetOut, uint256 valueOut, Assets.Type assetOutType);
    event AskRemoved(address indexed owner, uint256 indexed id, address assetOut, uint256 valueOut, Assets.Type assetOutType);
    event DoBid(address indexed bidder, uint256 indexed id, address AssetBidIn, uint256 valueBidIn);

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4){
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }

    //TODO: get metadata pair in contract AssetTrading
    function getAllPairActive() external view override returns(Assets.Pair[] memory){
        Assets.Pair[] memory result = new Assets.Pair[](counterPairActive.current());
        uint256 cnt = 0;
        for (uint256 i = 0; i < pairs.length; i++){
            if (pairs[i]._is_finished) {
                continue;
            }
            result[cnt] = pairs[i];
            unchecked {
                cnt++;
            }
        }
        return result;
    }
    function getPairsByOwner(address owner) external view override returns(Assets.Pair[] memory){
        Assets.Pair[] memory result = new Assets.Pair[](pairIdsByOwners[owner].length);
        for (uint256 i = 0; i < pairIdsByOwners[owner].length; i++){
            result[i] = pairs[pairIdsByOwners[owner][i]];        
        }
        return result;
    }
    function getPairById(uint256 id) external view returns(Assets.Pair memory) {
        return pairs[id];
    }
    //TODO: handle logic core function
    function _getPrice(uint256 amountOut, uint256 amountIn) internal pure returns(uint256){
        return amountOut*PRICE_DECIMAL/amountIn;
    }
    function _createAsk(
        address assetOut,
        uint256 amountOut,
        address assetIn,
        uint256 amountIn
        ) internal returns(uint256){
        Assets.Pair memory pair;

        pair._id = pairs.length;

        pair._owner = msg.sender;
        pairIdsByOwners[msg.sender].push(pair._id);

        pair._asset_out._asset_address = assetOut;
        pair._asset_out._amount = amountOut;

        pair._asset_in._asset_address = assetIn;
        pair._asset_in._amount = amountIn;

        pairs.push(pair);
        counterPairActive.increment();

        return pair._id;
    }
    function _checkValidTokenId(address sender, address token, uint256 id) internal view {
        address ownerToken = IERC721(token).ownerOf(id);
        require(sender != ownerToken, "AssetTrading: YOU_ARE_ALREADY_OWNER_TOKEN");
    }
    //TODO: handle create ask Tokens to Tokens, ETH, NFTs
    function createAskTokensToTokens(
        address tokenOut,
        uint256 amountOut,
        address tokenIn,
        uint256 amountIn
    ) external lock validAmount(amountOut) validAmount(amountIn) validAddress(tokenOut) validAddress(tokenIn) override {
        require(tokenOut != tokenIn, "AssetTrading: IDENTICAL_ADDRESSES");
        uint256 price = _getPrice(amountOut, amountIn);

        IERC20(tokenOut).safeTransferFrom(msg.sender, address(this), amountOut);
        uint256 id = _createAsk(tokenOut, amountOut, tokenIn, amountIn);
        
        pairs[id]._price = price;
        pairs[id]._asset_out._type = Assets.Type.ERC20;
        pairs[id]._asset_in._type = Assets.Type.ERC20;

        emit AskCreated(msg.sender, id, tokenOut, amountOut, pairs[id]._asset_out._type);
    }
    function createAskTokensToETH(
        address tokenOut,
        uint256 amountOut,
        uint256 amountIn
    ) external lock validAmount(amountOut) validAmount(amountIn) validAddress(tokenOut) override {
        uint256 price = _getPrice(amountOut, amountIn);            

        IERC20(tokenOut).safeTransferFrom(msg.sender, address(this), amountOut);
        uint256 id = _createAsk(tokenOut, amountOut, address(0), amountIn);

        pairs[id]._price = price;
        pairs[id]._asset_out._type = Assets.Type.ERC20;
        pairs[id]._asset_in._type = Assets.Type.ETH;

        emit AskCreated(msg.sender, id, tokenOut, amountOut, pairs[id]._asset_out._type);
    }
    function createAskTokensToNFT(address tokenOut, uint256 amountOut, address tokenIn, uint256 tokenIdIn) external lock validAmount(amountOut) validAddress(tokenOut) validAddress(tokenIn) override {
        require(tokenOut != tokenIn, "AssetTrading: IDENTICAL_ADDRESSES");
        _checkValidTokenId(msg.sender, tokenIn, tokenIdIn);
        IERC20(tokenOut).safeTransferFrom(msg.sender, address(this), amountOut);
        uint256 id = _createAsk(tokenOut, amountOut, tokenIn, 1);

        pairs[id]._price = amountOut;
        pairs[id]._asset_out._type = Assets.Type.ERC20;
        pairs[id]._asset_in._token_id = tokenIdIn;
        pairs[id]._asset_in._type = Assets.Type.ERC721;

        emit AskCreated(msg.sender, id, tokenOut, amountOut, pairs[id]._asset_out._type);
    }
    
    //TODO: handle create ask ETH to Tokens, NFTs
    function createAskETHToTokens(
        address tokenIn,
        uint256 amountIn
    ) external payable lock validAmount(msg.value) validAmount(amountIn) validAddress(tokenIn) override {
        uint256 price = _getPrice(msg.value, amountIn);
        
        uint256 id = _createAsk(address(0), msg.value, tokenIn, amountIn);

        pairs[id]._price = price;
        pairs[id]._asset_out._type = Assets.Type.ETH;
        pairs[id]._asset_in._type = Assets.Type.ERC20;

        emit AskCreated(msg.sender, id, address(0), msg.value, pairs[id]._asset_out._type);
    }
    function createAskETHToNFT(address tokenIn, uint256 tokenIdIn) external payable lock validAmount(msg.value) validAddress(tokenIn) override {
        _checkValidTokenId(msg.sender, tokenIn, tokenIdIn);
        uint256 id = _createAsk(address(0), msg.value, tokenIn, 1);
        
        pairs[id]._price = msg.value;
        pairs[id]._asset_out._type = Assets.Type.ETH;
        pairs[id]._asset_in._token_id = tokenIdIn;
        pairs[id]._asset_in._type = Assets.Type.ERC721;
    
        emit AskCreated(msg.sender, id, address(0), msg.value, pairs[id]._asset_out._type);
    }

    //TODO: handle create ask NFTs to Tokens, ETH, NFTs
    function createAskNFTToTokens(address tokenOut, uint256 tokenIdOut, address tokenIn, uint256 amountIn) external lock validAmount(amountIn) validAddress(tokenOut) validAddress(tokenIn) override {
        require(tokenOut != tokenIn, "AssetTrading: IDENTICAL_ADDRESSES");
        IERC721(tokenOut).safeTransferFrom(msg.sender, address(this), tokenIdOut);
        uint256 id = _createAsk(tokenOut, 1, tokenIn, amountIn);

        pairs[id]._price = amountIn;
        pairs[id]._asset_out._type = Assets.Type.ERC721;
        pairs[id]._asset_out._token_id = tokenIdOut;
        pairs[id]._asset_in._type = Assets.Type.ERC20;

        
        emit AskCreated(msg.sender, id, tokenOut, tokenIdOut, pairs[id]._asset_out._type);
    }
    function createAskNFTToETH(address tokenOut, uint256 tokenIdOut, uint256 amountIn) external lock validAmount(amountIn) validAddress(tokenOut) override {

        IERC721(tokenOut).safeTransferFrom(msg.sender, address(this), tokenIdOut);
        uint256 id = _createAsk(tokenOut, 1, address(0), amountIn);

        pairs[id]._price = amountIn;
        pairs[id]._asset_out._type = Assets.Type.ERC721;
        pairs[id]._asset_out._token_id = tokenIdOut;
        pairs[id]._asset_in._type = Assets.Type.ETH;

        emit AskCreated(msg.sender, id, tokenOut, tokenIdOut, pairs[id]._asset_out._type);
    }
    function createAskNFTToNFT(address tokenOut, uint256 tokenIdOut, address tokenIn, uint256 tokenIdIn) external lock validAddress(tokenOut) validAddress(tokenIn) override {
        _checkValidTokenId(msg.sender, tokenIn, tokenIdIn);
        IERC721(tokenOut).safeTransferFrom(msg.sender, address(this), tokenIdOut);
        uint256 id = _createAsk(tokenOut, 1, tokenIn, 1);

        pairs[id]._price = PRICE_DECIMAL;       
        pairs[id]._asset_out._type = Assets.Type.ERC721;
        pairs[id]._asset_out._token_id = tokenIdOut;
        pairs[id]._asset_in._type = Assets.Type.ERC721;
        pairs[id]._asset_in._token_id = tokenIdIn;

        emit AskCreated(msg.sender, id, tokenOut, tokenIdOut, pairs[id]._asset_out._type);
    }

    function removeAsk(uint256 id) external lock askIsActive(id) override {
        address owner = pairs[id]._owner;
        require(owner == msg.sender, "AssetTrading: NOT_ASK_OWNER");
    
        address assetAddress = pairs[id]._asset_out._asset_address;
        uint256 value = pairs[id]._asset_out._amount;
        Assets.Type assetType = pairs[id]._asset_out._type;

        pairs[id]._is_finished = true;
        counterPairActive.decrement();
        
        if (assetType == Assets.Type.ERC721)
        {
            value = pairs[id]._asset_out._token_id;
            IERC721(assetAddress).safeTransferFrom(address(this), owner, value);
        }
        else if (assetType == Assets.Type.ERC20)
        {
            IERC20(assetAddress).safeTransfer(owner, value);
        }else {
            payable(owner).transfer(value);
        }
        emit AskRemoved(msg.sender, id, assetAddress, value, assetType);
    }
    /*
    amountOut*decimals/AmountIn = price => amountOut*decimals = price*amountIn
    =>  amountBidIn = (price*amountBidOut)/decimals
    =>  newAmountOut = amountOut - amountBidIn = amountOut - (price*amountBidIn)/decimals
    => newAmountIn = amountIn - amountBibIn;
     */
    function _getAmountBidIn(uint256 id, uint256 amountBidOut) internal view returns(uint256){
        if (amountBidOut == pairs[id]._asset_in._amount) {
            return pairs[id]._asset_in._amount;
        }else {
            return pairs[id]._asset_out._amount * amountBidOut / pairs[id]._asset_in._amount;
        }
    }
    function _updatePairAfterDoBid(uint256 id, uint256 amountBidOut, uint256 amountBidIn) internal {
        //  Update new amountIn and amountOut in pair
        if (amountBidOut == pairs[id]._asset_in._amount){
            pairs[id]._is_finished = true;
            counterPairActive.decrement();
        }
        pairs[id]._asset_out._amount = pairs[id]._asset_out._amount - amountBidIn;
        pairs[id]._asset_in._amount = pairs[id]._asset_in._amount - amountBidOut;      
    }
    //TODO: handle do bid pair TOKEN, ETH, NFT => TOKEN
    function doBidTokens(uint256 id, uint256 amountBidOut) external lock validAmount(amountBidOut) askIsActive(id) override {
        require(pairs[id]._asset_in._type == Assets.Type.ERC20, "AssetTrading: INVALID_PAIR_ID");
        require(amountBidOut <= pairs[id]._asset_in._amount, "AssetTrading: EXCESSIVE_AMOUNT");
        
        address ownerPair = pairs[id]._owner;
        Assets.Type assetOutType = pairs[id]._asset_out._type;
        uint256 amountBidIn = 1;
        uint256 valueBidIn;
        
        if (assetOutType != Assets.Type.ERC721){
        
            amountBidIn = _getAmountBidIn(id, amountBidOut);
            valueBidIn = amountBidIn;

            IERC20(pairs[id]._asset_in._asset_address).safeTransferFrom(msg.sender, ownerPair, amountBidOut);

            if (assetOutType == Assets.Type.ERC20)
            {
                // PAIR TOKEN => TOKEN
                IERC20(pairs[id]._asset_out._asset_address).safeTransfer(msg.sender, amountBidIn);
            }else {
                // PAIR ETH => TOKEN
                payable(msg.sender).transfer(amountBidIn);
            }
        }else {
            // PAIR NFT => TOKEN
            require(amountBidOut == pairs[id]._asset_in._amount, "AssetTrading: INCORRECT_AMOUNT");
        
            uint256 tokenIdBidIn = pairs[id]._asset_out._token_id;
            valueBidIn = tokenIdBidIn;
            IERC20(pairs[id]._asset_in._asset_address).safeTransferFrom(msg.sender, ownerPair, amountBidOut);
            IERC721(pairs[id]._asset_out._asset_address).safeTransferFrom(address(this), msg.sender, tokenIdBidIn);
        }
        _updatePairAfterDoBid(id, amountBidOut, amountBidIn);
        emit DoBid(msg.sender, id, pairs[id]._asset_out._asset_address, valueBidIn);
    }
    //TODO: handle do bid pair TOKEN, NFT => ETH
    function doBidETH(uint256 id) external payable lock validAmount(msg.value) askIsActive(id) override {
        require(pairs[id]._asset_in._type == Assets.Type.ETH, "AssetTrading: INVALID_PAIR_ID");
        require(msg.value <= pairs[id]._asset_in._amount, "AssetTrading: EXCESSIVE_AMOUNT");
        
        address ownerPair = pairs[id]._owner;
        Assets.Type assetOutType = pairs[id]._asset_out._type;
        uint256 amountBidIn = 1;
        uint256 valueBidIn;

        if (assetOutType == Assets.Type.ERC20){
            // PAIR TOKEN => ETH            
            amountBidIn = _getAmountBidIn(id, msg.value);
            valueBidIn = amountBidIn;
            payable(ownerPair).transfer(msg.value);
            IERC20(pairs[id]._asset_out._asset_address).safeTransfer(msg.sender, amountBidIn);
        }else {
            // PAIR NFT => ETH
            require(msg.value == pairs[id]._asset_in._amount, "AssetTrading: INCORRECT_AMOUNT");
        
            uint256 tokenIdBidIn = pairs[id]._asset_out._token_id;
            valueBidIn = tokenIdBidIn;
            payable(ownerPair).transfer(msg.value);
            IERC721(pairs[id]._asset_out._asset_address).safeTransferFrom(address(this), msg.sender, tokenIdBidIn);
        }
        _updatePairAfterDoBid(id, msg.value, amountBidIn);
        emit DoBid(msg.sender, id, pairs[id]._asset_out._asset_address, valueBidIn);
    }
    //TODO: handle do bid pair TOKEN, ETH, NFT => NFT
    function doBidNFT(uint256 id, uint256 tokenIdBidOut) external lock askIsActive(id) override {
        
        require(pairs[id]._asset_in._type == Assets.Type.ERC721, "AssetTrading: INVALID_PAIR_ID");
        require(tokenIdBidOut == pairs[id]._asset_in._token_id, "AssetTrading: INCORRECT_TOKEN_ID");
        address ownerPair = pairs[id]._owner;
        Assets.Type assetOutType = pairs[id]._asset_out._type;
        uint256 amountBidIn = 1;
        uint256 valueBidIn;
 
        IERC721(pairs[id]._asset_in._asset_address).safeTransferFrom(msg.sender, ownerPair, tokenIdBidOut);

        if (assetOutType != Assets.Type.ERC721){
            amountBidIn = pairs[id]._asset_out._amount;
            valueBidIn = amountBidIn;
            if (assetOutType == Assets.Type.ERC20)
            {
                // PAIR TOKEN => NFT
                IERC20(pairs[id]._asset_out._asset_address).safeTransfer(msg.sender, valueBidIn);
            }else {
                // PAIR ETH => NFT
                payable(msg.sender).transfer(valueBidIn);
            }
        }else {
            // PAIR NFT => NFT
            valueBidIn = pairs[id]._asset_out._token_id;
            IERC721(pairs[id]._asset_out._asset_address).safeTransferFrom(address(this), msg.sender, valueBidIn);
        }
    
        _updatePairAfterDoBid(id, 1, amountBidIn);
        emit DoBid(msg.sender, id, pairs[id]._asset_out._asset_address, valueBidIn);
    }
}
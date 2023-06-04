import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { writeFile } from "fs/promises";

const BN = BigNumber.from;
const maxUint256 = BN(2).pow(BN(256)).sub(1);
const expandTo18Decimals = (value: number) => {
  return BN(value).mul(BN(10).pow(BN(18)));
}
describe("AssetTrading Test", async function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  const [owner, otherAccount] = await ethers.getSigners();
  let tokenA: Contract;
  let tokenB: Contract;
  let nftA: Contract;
  let nftB: Contract;
  let assetTrading: Contract;
  beforeEach(async function () {
    // Contracts are deployed using the first signer/account by default
    // console.log("Deploy");
    const TokenA = await ethers.getContractFactory("TokenA");
    tokenA = await TokenA.deploy(); // Deployed TokenA and mint 100.000 Token to owner
    // console.log("1. TokenA address at: " + tokenA.address);

    const TokenB = await ethers.getContractFactory("TokenB");
    tokenB = await TokenB.deploy(); // Deployed TokenB and mint 100.000 Token to owner
    // console.log("2. TokenB address at: " + tokenB.address);

    const NFTsA = await ethers.getContractFactory("NFTsA");
    nftA = await NFTsA.deploy();
    // console.log("3. NFTsA address at: " + nftA.address);

    const NFTsB = await ethers.getContractFactory("NFTsB");
    nftB = await NFTsB.deploy();
    // console.log("4. NFTsB address at: " + nftB.address);

    const AssetTrading = await ethers.getContractFactory("AssetTrading");
    assetTrading = await AssetTrading.deploy();
    // console.log("5. AssetTrading address at: " + assetTrading.address);

    await writeFile('test/test-contract-address.json', JSON.stringify({
      "TokenA": tokenA.address,
      "TokenB": tokenB.address,
      "NFTsA": nftA.address,
      "NFTsB": nftB.address,
      "AssetTrading": assetTrading.address,
      "owner": owner.address,
      "otherAccount": otherAccount.address
    }));
  });
  const type = {
    ETH: 0,
    ERC20: 1,
    ERC721: 2
  }

  describe("1. createAskTokensToTokens", async function () {
    let tokenOut: string;
    let amountOut: BigNumber;
    let tokenIn: string;
    let amountIn: BigNumber;
    it("1. Should throw error when tokenOut has an invalid address.", async function () {
      tokenOut = "abcdasdad";
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.throws;
    });
    it("2. Should throw error when amountOut < 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = BN(-1);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.throws;
    });
    it("3. Should throw error when amountOut > maxUint256 (2^256-1).", async function () {
      tokenOut = tokenA.address;
      amountOut = maxUint256.add(1);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.throws;
    });
    it("4. Should throw error when tokenIn has an invalid address.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      tokenIn = "sadads";
      amountIn = expandTo18Decimals(1);
      expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.throws;
    });
    it("5. Should throw error when amountIn < 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = BN(-1);
      expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.throws;
    });
    it("6. Should throw error when amountIn > maxUint256 (2^256-1).", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = maxUint256.add(1);
      expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.throws;
    });
    it("7. Should throw error when send transaction with value (ETH) !=0.", async function () {
      tokenOut = tokenA.address;
      amountOut = BN(1);
      tokenIn = tokenB.address;
      amountIn = BN(1);
      expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn, { value: BN(1) }
      )).to.throws;
    });
    it("8. Should revert when amountOut == 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = BN(0);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("9. Should revert when amountIn == 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = BN(0);
      await expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("10. Should revert when tokenOut is address(0).", async function () {
      tokenOut = ethers.constants.AddressZero;
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("11. Should revert when tokenIn is address(0).", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      tokenIn = ethers.constants.AddressZero;
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("12. Should revert when address tokenOut == address tokenIn.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenA.address;
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("AssetTrading: IDENTICAL_ADDRESSES");
    });
    it("13. Should revert when insufficient allowance.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(10);
      // no approve
      await expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("ERC20: insufficient allowance");
      // approve insufficient
      await tokenA.approve(assetTrading.address, expandTo18Decimals(9));
      await expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("ERC20: insufficient allowance");
    });
    it("14. Should revert when transfer amount exceeds balance.", async function () {
      tokenOut = tokenA.address;
      amountOut = (await tokenA.balanceOf(owner.address)).add(1);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(10);
      await tokenA.approve(assetTrading.address, amountOut);
      await expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
    it("15. Should create pair with 10 TokenA swap 20 TokenB", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(20);
      // Balance TokenA before create PAIR
      const balanceTokenABeforeCreatePair = await tokenA.balanceOf(owner.address);
      await tokenA.approve(assetTrading.address, amountOut);

      await expect(assetTrading.createAskTokensToTokens(
        tokenOut,
        amountOut,
        tokenIn,
        amountIn
      )).to.emit(tokenA, 'Transfer').withArgs(owner.address, assetTrading.address, amountOut)
        .to.emit(assetTrading, 'AskCreated').withArgs(owner.address, 0, tokenA.address, amountOut, type.ERC20);

      // check balance TokenA after create PAIR
      expect(await tokenA.balanceOf(owner.address)).to.eq(balanceTokenABeforeCreatePair.sub(amountOut));

      // check pair info
      const pair = await assetTrading.getPairById(0);

      expect(pair._asset_out._asset_address).to.eq(tokenOut);
      expect(pair._asset_out._amount).to.eq(amountOut);
      expect(pair._asset_out._type).to.eq(type.ERC20);

      expect(pair._asset_in._asset_address).to.eq(tokenIn);
      expect(pair._asset_in._amount).to.eq(amountIn);
      expect(pair._asset_in._type).to.eq(type.ERC20);

      expect(pair._price).to.eq(amountOut.mul(await assetTrading.PRICE_DECIMAL()).div(amountIn));
      expect(pair._is_finished).to.eq(false);
    });
  });

  describe("2. createAskTokensToETH", async function () {
    let tokenOut: string;
    let amountOut: BigNumber;
    let amountIn: BigNumber;
    it("1. Should throw error when tokenOut has an invalid address.", async function () {
      tokenOut = "abcdasdad";
      amountOut = expandTo18Decimals(10);
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.throws;
    });
    it("2. Should throw error when amountOut < 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = BN(-1);
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.throws;
    });
    it("3. Should throw error when amountOut > maxUint256 (2^256-1).", async function () {
      tokenOut = tokenA.address;
      amountOut = maxUint256.add(1);
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.throws;
    });
    it("4. Should throw error when amountIn < 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      amountIn = BN(-1);
      expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.throws;
    });
    it("5. Should throw error when amountIn > maxUint256 (2^256-1).", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      amountIn = maxUint256.add(1);
      expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.throws;
    });
    it("6. Should throw error when send transaction with value (ETH) !=0.", async function () {
      tokenOut = tokenA.address;
      amountOut = BN(1);
      amountIn = BN(1);
      expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn, { value: BN(1) }
      )).to.throws;
    });
    it("7. Should revert when amountOut == 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = BN(0);
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("8. Should revert when amountIn == 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      amountIn = BN(0);
      await expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("9. Should revert when tokenOut is address(0).", async function () {
      tokenOut = ethers.constants.AddressZero;
      amountOut = expandTo18Decimals(10);
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("10. Should revert when insufficient allowance.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      amountIn = expandTo18Decimals(10);
      // no approve
      await expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.be.revertedWith("ERC20: insufficient allowance");
      // approve insufficient
      await tokenA.approve(assetTrading.address, expandTo18Decimals(9));
      await expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.be.revertedWith("ERC20: insufficient allowance");
    });
    it("11. Should revert when transfer amount exceeds balance.", async function () {
      tokenOut = tokenA.address;
      amountOut = (await tokenA.balanceOf(owner.address)).add(1);
      amountIn = expandTo18Decimals(10);
      await tokenA.approve(assetTrading.address, amountOut);
      await expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
    it("12. Should create pair with 10 TokenA swap 20 ETH", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      amountIn = expandTo18Decimals(20);
      // Balance TokenA before create PAIR
      const balanceTokenABeforeCreatePair = await tokenA.balanceOf(owner.address);
      await tokenA.approve(assetTrading.address, amountOut);

      await expect(assetTrading.createAskTokensToETH(
        tokenOut,
        amountOut,
        amountIn
      )).to.emit(tokenA, 'Transfer').withArgs(owner.address, assetTrading.address, amountOut)
        .to.emit(assetTrading, 'AskCreated').withArgs(owner.address, 0, tokenA.address, amountOut, type.ERC20);

      // check balance TokenA after create PAIR
      expect(await tokenA.balanceOf(owner.address)).to.eq(balanceTokenABeforeCreatePair.sub(amountOut));

      // check pair info
      const pair = await assetTrading.getPairById(0);

      expect(pair._asset_out._asset_address).to.eq(tokenOut);
      expect(pair._asset_out._amount).to.eq(amountOut);
      expect(pair._asset_out._type).to.eq(type.ERC20);

      expect(pair._asset_in._asset_address).to.eq(ethers.constants.AddressZero);
      expect(pair._asset_in._amount).to.eq(amountIn);
      expect(pair._asset_in._type).to.eq(type.ETH);

      expect(pair._price).to.eq(amountOut.mul(await assetTrading.PRICE_DECIMAL()).div(amountIn));
      expect(pair._is_finished).to.eq(false);
    });
  });

  describe("3. createAskTokensToNFT", async function () {
    let tokenOut: string;
    let amountOut: BigNumber;
    let nftIn: string;
    let nftIdIn: BigNumber;
    it("1. Should throw error when tokenOut has an invalid address.", async function () {
      tokenOut = "abcdasdad";
      amountOut = expandTo18Decimals(10);
      nftIn = nftA.address;
      nftIdIn = BN(0);
      expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.throws;
    });
    it("2. Should throw error when amountOut < 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = BN(-1);
      nftIn = nftA.address;
      nftIdIn = BN(0);
      expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.throws;
    });
    it("3. Should throw error when amountOut > maxUint256 (2^256-1).", async function () {
      tokenOut = tokenA.address;
      amountOut = maxUint256.add(1);
      nftIn = nftA.address;
      nftIdIn = BN(0);
      expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.throws;
    });
    it("4. Should throw error when NFT In has an invalid address.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      nftIn = "sadads";
      nftIdIn = BN(0);
      expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.throws;
    });
    it("5. Should throw error when NFT ID In < 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      nftIn = nftA.address;
      nftIdIn = BN(-1);
      expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.throws;
    });
    it("6. Should throw error when NFT ID In > maxUint256 (2^256-1).", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      nftIn = nftA.address;
      nftIdIn = maxUint256.add(1);
      expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.throws;
    });
    it("7. Should throw error when send transaction with value (ETH) !=0.", async function () {
      tokenOut = tokenA.address;
      amountOut = BN(1);
      nftIn = nftA.address;
      nftIdIn = BN(1);
      expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn, { value: BN(1) }
      )).to.throws;
    });
    it("8. Should revert when amountOut == 0.", async function () {
      tokenOut = tokenA.address;
      amountOut = BN(0);
      nftIn = nftA.address;
      nftIdIn = BN(0);
      await expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("9. Should revert when tokenOut is address(0).", async function () {
      tokenOut = ethers.constants.AddressZero;
      amountOut = expandTo18Decimals(10);
      nftIn = nftA.address;
      nftIdIn = BN(0);
      await expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("10. Should revert when NFT In is address(0).", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      nftIn = ethers.constants.AddressZero;
      nftIdIn = BN(0);
      await expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("11. Should revert when address tokenOut == address NFT In.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      nftIn = tokenA.address;
      nftIdIn = BN(0);
      await expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("AssetTrading: IDENTICAL_ADDRESSES");
    });
    it("12. Should revert when NFT ID In is not exist.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      nftIn = nftA.address;
      nftIdIn = BN(0);
      await tokenA.approve(assetTrading.address, amountOut);
      await expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("ERC721: invalid token ID");
    });
    it("13. Should revert when caller is already onwer of NFT ID In.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      nftIn = nftA.address;
      nftIdIn = BN(0);
      await nftA.safeMint(owner.address);
      await tokenA.approve(assetTrading.address, amountOut);
      await expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("AssetTrading: YOU_ARE_ALREADY_OWNER_TOKEN");
    });
    it("14. Should revert when insufficient allowance.", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      nftIn = nftA.address;
      nftIdIn = BN(0);
      await nftA.safeMint(otherAccount.address);
      // no approve
      await expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("ERC20: insufficient allowance");
      // approve insufficient
      await tokenA.approve(assetTrading.address, expandTo18Decimals(9));
      await expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("ERC20: insufficient allowance");
    });
    it("15. Should revert when transfer amount exceeds balance.", async function () {
      tokenOut = tokenA.address;
      amountOut = (await tokenA.balanceOf(owner.address)).add(1);
      nftIn = nftA.address;
      nftIdIn = BN(0);
      await nftA.safeMint(otherAccount.address);
      await tokenA.approve(assetTrading.address, amountOut);
      await expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
    it("16. Should create pair with 10 TokenA swap 1 NFTsA", async function () {
      tokenOut = tokenA.address;
      amountOut = expandTo18Decimals(10);
      nftIn = nftA.address;
      nftIdIn = BN(0);
      await nftA.safeMint(otherAccount.address);
      // Balance TokenA before create PAIR
      const balanceTokenABeforeCreatePair = await tokenA.balanceOf(owner.address);
      await tokenA.approve(assetTrading.address, amountOut);

      await expect(assetTrading.createAskTokensToNFT(
        tokenOut,
        amountOut,
        nftIn,
        nftIdIn
      )).to.emit(tokenA, 'Transfer').withArgs(owner.address, assetTrading.address, amountOut)
        .to.emit(assetTrading, 'AskCreated').withArgs(owner.address, 0, tokenA.address, amountOut, type.ERC20);

      // check balance TokenA after create PAIR
      expect(await tokenA.balanceOf(owner.address)).to.eq(balanceTokenABeforeCreatePair.sub(amountOut));

      // check pair info
      const pair = await assetTrading.getPairById(0);

      expect(pair._asset_out._asset_address).to.eq(tokenOut);
      expect(pair._asset_out._amount).to.eq(amountOut);
      expect(pair._asset_out._type).to.eq(type.ERC20);

      expect(pair._asset_in._asset_address).to.eq(nftIn);
      expect(pair._asset_in._amount).to.eq(1);
      expect(pair._asset_in._token_id).to.eq(nftIdIn);
      expect(pair._asset_in._type).to.eq(type.ERC721);

      expect(pair._price).to.eq(amountOut);
      expect(pair._is_finished).to.eq(false);
    });

  });

  describe("4. createAskETHToTokens", async function () {
    let amountOut: BigNumber;
    let tokenIn: string;
    let amountIn: BigNumber;
    let tx;
    let gasUsed: BigNumber;
    let balanceETHBeforeCreateAsk: BigNumber;
    it("1. Should throw error when tokenIn has an invalid address.", async function () {
      amountOut = expandTo18Decimals(10);
      tokenIn = "abc";
      amountIn = expandTo18Decimals(20);
      expect(assetTrading.createAskETHToTokens(
        tokenIn,
        amountIn, { value: amountOut }
      )).to.be.throws;
    });
    it("2. Should throw error when amountIn < 0.", async function () {
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = BN(-1);
      expect(assetTrading.createAskETHToTokens(
        tokenIn,
        amountIn, { value: amountOut }
      )).to.be.throws;
    });
    it("3. Should throw error when amountIn > maxUint256 (2^256-1).", async function () {
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = maxUint256.add(1);
      expect(assetTrading.createAskETHToTokens(
        tokenIn,
        amountIn, { value: amountOut }
      )).to.be.throws;
    });
    it("4. Should throw error when send transaction with value (ETH) < 0.", async function () {
      amountOut = BN(-1);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(20);
      expect(assetTrading.createAskETHToTokens(
        tokenIn,
        amountIn, { value: amountOut }
      )).to.be.throws;
    });
    it("5. Should throw error when send transaction with value (ETH) > maxUint256.", async function () {
      amountOut = maxUint256.add(1);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(20);
      expect(assetTrading.createAskETHToTokens(
        tokenIn,
        amountIn, { value: amountOut }
      )).to.be.throws;
    });
    it("6. Should throw error when transfer amount exceeds balance.", async function () {
      amountOut = (await owner.getBalance()).add(1);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(20);
      expect(assetTrading.createAskETHToTokens(
        tokenIn,
        amountIn, { value: amountOut }
      )).to.be.throws;
    });
    it("7. Should revert when value (ETH) == 0.", async function () {
      amountOut = BN(0);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(20);
      await expect(assetTrading.createAskETHToTokens(
        tokenIn,
        amountIn, { value: amountOut }
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("8. Should revert when amountIn == 0.", async function () {
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = BN(0);
      await expect(assetTrading.createAskETHToTokens(
        tokenIn,
        amountIn, { value: amountOut }
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("9. Should revert when tokenIn is address(0).", async function () {
      amountOut = expandTo18Decimals(10);
      tokenIn = ethers.constants.AddressZero;
      amountIn = expandTo18Decimals(20);
      await expect(assetTrading.createAskETHToTokens(
        tokenIn,
        amountIn, { value: amountOut }
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("10. Should create pair with 10 ETH swap 20 TokenB", async function () {
      amountOut = expandTo18Decimals(10);
      tokenIn = tokenB.address;
      amountIn = expandTo18Decimals(20);
      balanceETHBeforeCreateAsk = await owner.getBalance();

      await expect(tx = await assetTrading.createAskETHToTokens(
        tokenIn,
        amountIn, { value: amountOut }
      )).to.emit(assetTrading, 'AskCreated').withArgs(owner.address, 0, ethers.constants.AddressZero, amountOut, type.ETH);

      gasUsed = (await tx.wait()).gasUsed;
      // check Balance ETH after create Pair
      expect(await owner.getBalance()).to.eq(balanceETHBeforeCreateAsk.sub(gasUsed).sub(amountOut));

      // check pair info
      const pair = await assetTrading.getPairById(0);

      expect(pair._asset_out._asset_address).to.eq(ethers.constants.AddressZero);
      expect(pair._asset_out._amount).to.eq(amountOut);
      expect(pair._asset_out._type).to.eq(type.ETH);

      expect(pair._asset_in._asset_address).to.eq(tokenIn);
      expect(pair._asset_in._amount).to.eq(amountIn);
      expect(pair._asset_in._type).to.eq(type.ERC20);

      expect(pair._price).to.eq(amountOut.mul(await assetTrading.PRICE_DECIMAL()).div(amountIn));
      expect(pair._is_finished).to.eq(false);
    });

  });

  describe("5. createAskETHToNFT", async function () {
    let amountOut: BigNumber;
    let nftIn: string;
    let nftIdIn: BigNumber;
    let tx;
    let gasUsed: BigNumber;
    let balanceETHBeforeCreateAsk: BigNumber;
    it("1. Should throw error when NFT In has an invalid address.", async function () {
      amountOut = expandTo18Decimals(10);
      nftIn = "abc";
      nftIdIn = BN(0)
      expect(assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      )).to.be.throws;
    });
    it("2. Should throw error when NFT ID In < 0.", async function () {
      amountOut = expandTo18Decimals(10);
      nftIn = nftB.address;
      nftIdIn = BN(-1);
      expect(assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      )).to.be.throws;
    });
    it("3. Should throw error when NFT ID In > maxUint256 (2^256-1).", async function () {
      amountOut = expandTo18Decimals(10);
      nftIn = nftB.address;
      nftIdIn = maxUint256.add(1);
      expect(assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      )).to.be.throws;
    });
    it("4. Should throw error when send transaction with value (ETH) < 0.", async function () {
      amountOut = BN(-1);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      expect(assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      )).to.be.throws;
    });
    it("5. Should throw error when send transaction with value (ETH) > maxUint256.", async function () {
      amountOut = maxUint256.add(1);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      expect(assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      )).to.be.throws;
    });
    it("6. Should throw error when transfer amount exceeds balance.", async function () {
      amountOut = (await owner.getBalance()).add(1);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      await nftB.safeMint(otherAccount.address);
      expect(assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      )).to.be.throws;
    });
    it("7. Should revert when value (ETH) == 0.", async function () {
      amountOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      expect(assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("8. Should revert when NFT In is address(0).", async function () {
      amountOut = expandTo18Decimals(10);
      nftIn = ethers.constants.AddressZero;
      nftIdIn = BN(0);
      await expect(assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("9. Should revert when NFT In is not exist.", async function () {
      amountOut = expandTo18Decimals(10);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      await expect(assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      )).to.be.revertedWith("ERC721: invalid token ID");
    });
    it("10. Should revert when caller is already owner NFT In.", async function () {
      amountOut = expandTo18Decimals(10);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      await nftB.safeMint(owner.address);
      await expect(assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      )).to.be.revertedWith("AssetTrading: YOU_ARE_ALREADY_OWNER_TOKEN");
    });
    it("11. Should create pair with 10 ETH swap 1 NFTsB", async function () {
      amountOut = expandTo18Decimals(10);
      nftIn = nftB.address;
      nftIdIn = BN(0);

      await nftB.safeMint(otherAccount.address);
      balanceETHBeforeCreateAsk = await owner.getBalance();

      await expect(tx = await assetTrading.createAskETHToNFT(
        nftIn,
        nftIdIn, { value: amountOut }
      ))
        .to.emit(assetTrading, 'AskCreated').withArgs(owner.address, 0, ethers.constants.AddressZero, amountOut, type.ETH);

      gasUsed = (await tx.wait()).gasUsed;
      // check balance ETH after create Pair
      expect(await owner.getBalance()).to.eq(balanceETHBeforeCreateAsk.sub(gasUsed).sub(amountOut));

      // check pair info
      const pair = await assetTrading.getPairById(0);

      expect(pair._asset_out._asset_address).to.eq(ethers.constants.AddressZero);
      expect(pair._asset_out._amount).to.eq(amountOut);
      expect(pair._asset_out._type).to.eq(type.ETH);

      expect(pair._asset_in._asset_address).to.eq(nftIn);
      expect(pair._asset_in._amount).to.eq(1);
      expect(pair._asset_in._token_id).to.eq(nftIdIn);
      expect(pair._asset_in._type).to.eq(type.ERC721);

      expect(pair._price).to.eq(amountOut);
      expect(pair._is_finished).to.eq(false);
    });
  });

  describe("6. createAskNFTToTokens", async function () {
    let nftOut: string;
    let nftIdOut: BigNumber;
    let tokenIn: string;
    let amountIn: BigNumber;
    it("1. Should throw error when NFT Out has an invalid address.", async function () {
      nftOut = "abc";
      nftIdOut = BN(0);
      tokenIn = tokenA.address;
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.throws;
    });
    it("2. Should throw error when NFT ID Out < 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(-1);
      tokenIn = tokenA.address;
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.throws;
    });
    it("3. Should throw error when NFT ID Out > maxUint256.", async function () {
      nftOut = nftA.address;
      nftIdOut = maxUint256.add(1);
      tokenIn = tokenA.address;
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.throws;
    });
    it("4. Should throw error when tokenIn has an invalid address.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = "abc";
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.throws;
    });
    it("5. Should throw error when amountIn < 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = tokenA.address;
      amountIn = BN(-1);
      expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.throws;
    });
    it("6. Should throw error when amountIn > maxUint256.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = tokenA.address;
      amountIn = maxUint256.add(1);
      expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.throws;
    });
    it("7. Should throw error when send transaction with value (ETH) != 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = tokenA.address;
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn, { value: BN(1) }
      )).to.be.throws;
    });
    it("8. Should revert when amountIn == 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = tokenA.address;
      amountIn = BN(0);
      await expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("9. Should revert when NFT Out is address(0).", async function () {
      nftOut = ethers.constants.AddressZero;
      nftIdOut = BN(0);
      tokenIn = tokenA.address;
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("10. Should revert when tokenIn is address(0).", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = ethers.constants.AddressZero;
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("11. Should revert when address NFT Out == address token In.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = nftA.address;
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("AssetTrading: IDENTICAL_ADDRESSES");
    });
    it("12. Should revert when NFT Out is not exist.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = tokenA.address;
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("ERC721: invalid token ID");
    });
    it("13. Should revert when caller is not NFT ID Out owner.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = tokenA.address;
      amountIn = expandTo18Decimals(10);
      await nftA.safeMint(otherAccount.address);
      await expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
    it("14. Should revert when caller is not approved NFT ID Out.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = tokenA.address;
      amountIn = expandTo18Decimals(10);
      await nftA.safeMint(owner.address);
      await expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      )).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
    it("15. Should create a pair to swap 1 NFTsA to 10 TokenA", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      tokenIn = tokenA.address;
      amountIn = expandTo18Decimals(10);
      await nftA.safeMint(owner.address);
      await nftA.setApprovalForAll(assetTrading.address, true);
      await expect(assetTrading.createAskNFTToTokens(
        nftOut,
        nftIdOut,
        tokenIn,
        amountIn
      ))
        .to.emit(nftA, 'Transfer').withArgs(owner.address, assetTrading.address, 0)
        .to.emit(assetTrading, 'AskCreated').withArgs(owner.address, 0, nftOut, nftIdOut, type.ERC721);

      // check owner NFT ID Out after create Pair
      expect(await nftA.ownerOf(0)).to.eq(assetTrading.address);

      // check pair info
      const pair = await assetTrading.getPairById(0);

      expect(pair._asset_out._asset_address).to.eq(nftOut);
      expect(pair._asset_out._amount).to.eq(1);
      expect(pair._asset_out._token_id).to.eq(nftIdOut);
      expect(pair._asset_out._type).to.eq(type.ERC721);

      expect(pair._asset_in._asset_address).to.eq(tokenIn);
      expect(pair._asset_in._amount).to.eq(amountIn);
      expect(pair._asset_in._type).to.eq(type.ERC20);

      expect(pair._price).to.eq(amountIn);
      expect(pair._is_finished).to.eq(false);
    });
  });

  describe("7. createAskNFTToETH", async function () {
    let nftOut: string;
    let nftIdOut: BigNumber;
    let amountIn: BigNumber;
    it("1. Should throw error when NFT Out has an invalid address.", async function () {
      nftOut = "abc";
      nftIdOut = BN(0);
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      )).to.be.throws;
    });
    it("2. Should throw error when NFT ID Out < 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(-1);
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      )).to.be.throws;
    });
    it("3. Should throw error when NFT ID Out > maxUint256.", async function () {
      nftOut = nftA.address;
      nftIdOut = maxUint256.add(1);
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      )).to.be.throws;
    });
    it("4. Should throw error when amountIn < 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      amountIn = BN(-1);
      expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      )).to.be.throws;
    });
    it("5. Should throw error when amountIn > maxUint256.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      amountIn = maxUint256.add(1);
      expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      )).to.be.throws;
    });
    it("6. Should throw error when send transaction with value (ETH) != 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      amountIn = expandTo18Decimals(10);
      expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn, { value: BN(1) }
      )).to.be.throws;
    });
    it("7. Should revert when amountIn == 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      amountIn = BN(0);
      await expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("8. Should revert when NFT Out is address(0).", async function () {
      nftOut = ethers.constants.AddressZero;
      nftIdOut = BN(0);
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("9. Should revert when NFT Out is not exist.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      amountIn = expandTo18Decimals(10);
      await expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      )).to.be.revertedWith("ERC721: invalid token ID");
    });
    it("10. Should revert when caller is not NFT ID Out owner.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      amountIn = expandTo18Decimals(10);
      await nftA.safeMint(otherAccount.address);
      await expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      )).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
    it("11. Should revert when caller is not approved NFT ID Out.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      amountIn = expandTo18Decimals(10);
      await nftA.safeMint(owner.address);
      expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      )).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
    it("12. Should create a pair to swap 1 NFTsA to 10 TokenA", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      amountIn = expandTo18Decimals(10);
      await nftA.safeMint(owner.address);
      await nftA.setApprovalForAll(assetTrading.address, true);
      await expect(assetTrading.createAskNFTToETH(
        nftOut,
        nftIdOut,
        amountIn
      ))
        .to.emit(nftA, 'Transfer').withArgs(owner.address, assetTrading.address, 0)
        .to.emit(assetTrading, 'AskCreated').withArgs(owner.address, 0, nftOut, nftIdOut, type.ERC721);

      // check owner NFT ID Out after create Pair
      expect(await nftA.ownerOf(0)).to.eq(assetTrading.address);

      // check pair info
      const pair = await assetTrading.getPairById(0);

      expect(pair._asset_out._asset_address).to.eq(nftOut);
      expect(pair._asset_out._amount).to.eq(1);
      expect(pair._asset_out._token_id).to.eq(nftIdOut);
      expect(pair._asset_out._type).to.eq(type.ERC721);

      expect(pair._asset_in._asset_address).to.eq(ethers.constants.AddressZero);
      expect(pair._asset_in._amount).to.eq(amountIn);
      expect(pair._asset_in._type).to.eq(type.ETH);

      expect(pair._price).to.eq(amountIn);
      expect(pair._is_finished).to.eq(false);
    });
  });

  describe("8. createAskNFTToNFT", async function () {
    let nftOut: string;
    let nftIdOut: BigNumber;
    let nftIn: string;
    let nftIdIn: BigNumber;
    it("1. Should throw error when NFT Out has an invalid address.", async function () {
      nftOut = "abc";
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.throws;
    });
    it("2. Should throw error when NFT ID Out < 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(-1);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.throws;
    });
    it("3. Should throw error when NFT ID Out > maxUint256.", async function () {
      nftOut = nftA.address;
      nftIdOut = maxUint256.add(1);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.throws;
    });
    it("4. Should throw error when NFT In has an invalid address.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = "abc";
      nftIdIn = BN(0);
      expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.throws;
    });
    it("5. Should throw error when NFT ID In < 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(-1);
      expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.throws;
    });
    it("6. Should throw error when NFT ID In > maxUint256.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = maxUint256.add(1);
      expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.throws;
    });
    it("7. Should throw error when send transaction with value (ETH) != 0.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn, { value: BN(1) }
      )).to.be.throws;
    });
    it("8. Should revert when NFT Out is address(0).", async function () {
      nftOut = ethers.constants.AddressZero;
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      await expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("9. Should revert when NFT In is address(0).", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = ethers.constants.AddressZero;
      nftIdIn = BN(0);
      await expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("AssetTrading: ZERO_ADDRESS");
    });
    it("10. Should revert when NFT In is not exist.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      await expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("ERC721: invalid token ID");
    });
    it("11. Should revert when caller is already owner NFT In.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      await nftB.safeMint(owner.address);
      await expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("AssetTrading: YOU_ARE_ALREADY_OWNER_TOKEN");
    });
    it("12. Should revert when NFT Out is not exist.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      await nftB.safeMint(otherAccount.address);
      await expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("ERC721: invalid token ID");
    });
    it("13. Should revert when caller is not NFT ID Out owner.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      await nftA.safeMint(otherAccount.address);
      await nftB.safeMint(otherAccount.address);
      await expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
    it("14. Should revert when caller is not approved NFT ID Out.", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      await nftA.safeMint(owner.address);
      await nftB.safeMint(otherAccount.address);
      await expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      )).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
    it("15. Should create a pair to swap 1 NFTsA to 1 NFTsB", async function () {
      nftOut = nftA.address;
      nftIdOut = BN(0);
      nftIn = nftB.address;
      nftIdIn = BN(0);
      await nftA.safeMint(owner.address);
      await nftB.safeMint(otherAccount.address);
      await nftA.setApprovalForAll(assetTrading.address, true);
      await expect(assetTrading.createAskNFTToNFT(
        nftOut,
        nftIdOut,
        nftIn,
        nftIdIn
      ))
        .to.emit(nftA, 'Transfer').withArgs(owner.address, assetTrading.address, 0)
        .to.emit(assetTrading, 'AskCreated').withArgs(owner.address, 0, nftOut, nftIdOut, type.ERC721);

      // check pair info
      const pair = await assetTrading.getPairById(0);

      expect(pair._asset_out._asset_address).to.eq(nftOut);
      expect(pair._asset_out._amount).to.eq(1);
      expect(pair._asset_out._token_id).to.eq(nftIdOut);
      expect(pair._asset_out._type).to.eq(type.ERC721);

      expect(pair._asset_in._asset_address).to.eq(nftIn);
      expect(pair._asset_in._amount).to.eq(1);
      expect(pair._asset_in._token_id).to.eq(nftIdIn);
      expect(pair._asset_in._type).to.eq(type.ERC721);

      expect(pair._price).to.eq(await assetTrading.PRICE_DECIMAL());
      expect(pair._is_finished).to.eq(false);
    });
  });

  describe("9. removeAsk", async function () {
    let pair;
    beforeEach(async function () {
      await tokenA.mint(otherAccount.address, expandTo18Decimals(1000000));
      // createAskTokensToTokens (10 tokenA to 20 TokenB) pairId = 0
      await tokenA.approve(assetTrading.address, tokenA.balanceOf(owner.address));
      await assetTrading.createAskTokensToTokens(
        tokenA.address,
        expandTo18Decimals(10),
        tokenB.address,
        expandTo18Decimals(20)
      )
      // createAskETHToTokens (10 ETH to 20 TokenB) pairId = 1
      await assetTrading.createAskETHToTokens(
        tokenB.address,
        expandTo18Decimals(20), { value: expandTo18Decimals(10) }
      )
      // createAskNFTToTokens (1 NFTsA to 20 TokenB) pairId = 2
      await nftA.safeMint(owner.address);
      await nftA.setApprovalForAll(assetTrading.address, true);
      await assetTrading.createAskNFTToTokens(
        nftA.address,
        0,
        tokenB.address,
        expandTo18Decimals(20)
      )
    });
    it("1. Should throw error when pair ID < 0.", async function () {
      expect(assetTrading.removeAsk(-1)).to.throws;
    });
    it("2. Should throw error when pair ID > maxUint256 (2^256-1).", async function () {
      expect(assetTrading.removeAsk(-1)).to.throws;
    });
    it("3. Should throw error when send transaction with value (ETH) !=0.", async function () {
      expect(assetTrading.removeAsk(0, { value: expandTo18Decimals(1) })).to.throws;
    });
    it("4. Should revert when pair ID is out range.", async function () {
      await expect(assetTrading.removeAsk(3)).to.be.revertedWith("AssetTrading: ID_OUT_RANGE");
    });
    it("5. Should revert when pair is not active.", async function () {
      await assetTrading.removeAsk(0);
      await expect(assetTrading.removeAsk(0)).to.be.revertedWith("AssetTrading: ASK_FINISHED");
    });
    it("6. Should revert when caller is not pair owner.", async function () {
      await expect(assetTrading.connect(otherAccount).removeAsk(0)).to.be.revertedWith("AssetTrading: NOT_ASK_OWNER");
    });
    it("7. Should reveice 10 TokenA when removed pair (10 TokenA to 20 Token B).", async function () {
      let balanceTokenABeforeRemoveAsk: BigNumber = await tokenA.balanceOf(owner.address);

      await expect(assetTrading.removeAsk(0))
        .to.emit(tokenA, 'Transfer').withArgs(assetTrading.address, owner.address, expandTo18Decimals(10))
        .to.emit(assetTrading, 'AskRemoved').withArgs(owner.address, 0, tokenA.address, expandTo18Decimals(10), type.ERC20);

      pair = await assetTrading.getPairById(0);

      expect(await tokenA.balanceOf(owner.address)).to.eq(balanceTokenABeforeRemoveAsk.add(expandTo18Decimals(10)));
      expect(pair._is_finished).to.eq(true);
    });
    it("8. Should reveice 10 ETH when removed pair (10 ETH to 20 Token B).", async function () {
      let tx;
      let balanceETHBeforeRemoveAsk: BigNumber = await owner.getBalance();

      await expect(tx = await assetTrading.removeAsk(1))
        .to.emit(assetTrading, 'AskRemoved').withArgs(owner.address, 1, ethers.constants.AddressZero, expandTo18Decimals(10), type.ETH);

      const gasUsed: BigNumber = (await tx.wait()).gasUsed;

      pair = await assetTrading.getPairById(1);

      expect(await owner.getBalance()).to.eq(balanceETHBeforeRemoveAsk.sub(gasUsed).add(expandTo18Decimals(10)));
      expect(pair._is_finished).to.eq(true);
    });
    it("9. Should reveice 1 NFTsA when removed pair (1 NFTsA to 20 Token B).", async function () {
      expect(await nftA.ownerOf(0)).to.eq(assetTrading.address);

      await expect(assetTrading.removeAsk(2))
        .to.emit(nftA, 'Transfer').withArgs(assetTrading.address, owner.address, 0)
        .to.emit(assetTrading, 'AskRemoved').withArgs(owner.address, 2, nftA.address, 0, type.ERC721);

      pair = await assetTrading.getPairById(2);

      expect(await nftA.ownerOf(0)).to.eq(owner.address);
      expect(pair._is_finished).to.eq(true);
    });
  });

  describe("10. doBidTokens", async function () {
    let id: BigNumber;
    let amountBidOut: BigNumber;
    it("1. Should throw error when Pair ID < 0", async function () {
      id = BN(-1);
      amountBidOut = BN(1);
      expect(assetTrading.doBidTokens(
        id,
        amountBidOut
      )).to.be.throws;
    });
    it("2. Should throw error when Pair ID > maxUint256", async function () {
      id = maxUint256.add(1);
      amountBidOut = BN(1);
      expect(assetTrading.doBidTokens(
        id,
        amountBidOut
      )).to.be.throws;
    });
    it("3. Should throw error when amountBidOut < 0", async function () {
      id = BN(0);
      amountBidOut = BN(-1);
      expect(assetTrading.doBidTokens(
        id,
        amountBidOut
      )).to.be.throws;
    });
    it("4. Should throw error when amountBidOut > maxUint256", async function () {
      id = BN(0);
      amountBidOut = maxUint256.add(1);
      expect(assetTrading.doBidTokens(
        id,
        amountBidOut
      )).to.be.throws;
    });
    it("5. Should throw error when send transaction with value (ETH) != 0", async function () {
      id = BN(0);
      amountBidOut = BN(1);
      expect(assetTrading.doBidTokens(
        id,
        amountBidOut, { value: BN(1) }
      )).to.be.throws;
    });
    it("6. Should revert when amountBidOut = 0", async function () {
      id = BN(0);
      amountBidOut = BN(0);
      await expect(assetTrading.doBidTokens(
        id,
        amountBidOut
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("7. Should revert when pair ID > pairs.length", async function () {
      id = await assetTrading.pairs.length;
      amountBidOut = expandTo18Decimals(10);
      await expect(assetTrading.doBidTokens(
        id,
        amountBidOut
      )).to.be.revertedWith("AssetTrading: ID_OUT_RANGE");
    });
    it("8. Should revert when pair ID is not active", async function () {
      // create pair example swap 10 tokenA to 10 tokenB and remove it
      const createPairExampleAndRemoveIt = async () => {
        // create pair id = 0
        await tokenA.approve(assetTrading.address, await tokenA.balanceOf(owner.address));
        await assetTrading.createAskTokensToTokens(tokenA.address, expandTo18Decimals(10), tokenB.address, expandTo18Decimals(10));
        // remove pair
        await assetTrading.removeAsk(0);
      }
      await createPairExampleAndRemoveIt();
      id = BN(0);
      amountBidOut = expandTo18Decimals(10);
      await expect(assetTrading.doBidTokens(
        id,
        amountBidOut
      )).to.be.revertedWith("AssetTrading: ASK_FINISHED");
    });
    it("9. Should revert when pair has type of assetIn is not ERC20", async function () {
      // create pair example with type assetIn is ETH
      const createPairExample = async () => {
        // create pair id = 0
        await tokenA.approve(assetTrading.address, await tokenA.balanceOf(owner.address));
        await assetTrading.createAskTokensToETH(tokenA.address, expandTo18Decimals(10), expandTo18Decimals(10));
      }
      await createPairExample();
      id = BN(0);
      amountBidOut = expandTo18Decimals(10);
      await expect(assetTrading.doBidTokens(
        id,
        amountBidOut
      )).to.be.revertedWith("AssetTrading: INVALID_PAIR_ID");
    });
    it("10. Should revert when amountBidOut > amountIn", async function () {
      // create pair example 
      const createPairExample = async () => {
        // create pair id = 0
        await tokenA.approve(assetTrading.address, await tokenA.balanceOf(owner.address));
        await assetTrading.createAskTokensToTokens(tokenA.address, expandTo18Decimals(10), tokenB.address, expandTo18Decimals(10));
      }
      await createPairExample();
      id = BN(0);
      amountBidOut = expandTo18Decimals(11);
      await expect(assetTrading.doBidTokens(
        id,
        amountBidOut
      )).to.be.revertedWith("AssetTrading: EXCESSIVE_AMOUNT");
    });
    describe("when assetOut is ERC721", async function () {
      beforeEach(async function () {
        // create Pair swap 1 NFTsA to 10 tokenA
        await nftA.safeMint(otherAccount.address);
        await nftA.connect(otherAccount).setApprovalForAll(assetTrading.address, true);
        await assetTrading.connect(otherAccount).createAskNFTToTokens(
          nftA.address,
          0,
          tokenA.address,
          expandTo18Decimals(10)
        );
      });
      it("11. Should revert when amountBidOut != amountIn", async function () {
        id = BN(0);
        amountBidOut = expandTo18Decimals(9);
        await expect(assetTrading.doBidTokens(
          id,
          amountBidOut
        )).to.be.revertedWith("AssetTrading: INCORRECT_AMOUNT");
      });
      it("12. Should revert when insufficient allowance.", async function () {
        id = BN(0);
        amountBidOut = expandTo18Decimals(10);
        // no approve
        await expect(assetTrading.doBidTokens(
          id,
          amountBidOut
        )).to.be.revertedWith("ERC20: insufficient allowance");
        // approve insufficient
        await tokenA.approve(assetTrading.address, amountBidOut.sub(1));
        await expect(assetTrading.doBidTokens(
          id,
          amountBidOut
        )).to.be.revertedWith("ERC20: insufficient allowance");
      });
      it("13. Should revert when transfer amount exceeds balance.", async function () {
        id = BN(0);
        amountBidOut = expandTo18Decimals(10);
        await tokenA.transfer(otherAccount.address, await tokenA.balanceOf(owner.address));
        await tokenA.mint(owner.address, amountBidOut.sub(1));
        await tokenA.approve(assetTrading.address, amountBidOut);
        await expect(assetTrading.doBidTokens(
          id,
          amountBidOut
        )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      });
      it("14. Should do bid 10 tokenA swap 1 NFTsA.", async function () {
        id = BN(0);
        amountBidOut = expandTo18Decimals(10);

        let pair = await assetTrading.getPairById(id);
        let balanceTokenAOfCallerBeforeDoBid = await tokenA.balanceOf(owner.address);
        let balanceTokenAOfOwnerPairBeforeDoBid = await tokenA.balanceOf(pair._owner);

        await tokenA.approve(assetTrading.address, amountBidOut)
        await expect(assetTrading.doBidTokens(
          id,
          amountBidOut
        ))
          .to.emit(tokenA, 'Transfer').withArgs(owner.address, pair._owner, amountBidOut)
          .to.emit(assetTrading, 'DoBid').withArgs(owner.address, id, pair._asset_out._asset_address, pair._asset_out._token_id);

        // check balance token A after doBid
        expect(await tokenA.balanceOf(owner.address)).to.eq(balanceTokenAOfCallerBeforeDoBid.sub(amountBidOut));
        expect(await tokenA.balanceOf(pair._owner)).to.eq(balanceTokenAOfOwnerPairBeforeDoBid.add(amountBidOut));
        // check owner NFT
        expect(await nftA.ownerOf(pair._asset_out._token_id)).to.eq(owner.address);
        // check status pair
        expect((await assetTrading.getPairById(id))._is_finished).to.eq(true);
      });
    });
    describe("when assetOut is ERC20 or ETH", async function () {
      beforeEach(async function () {
        // create Pair swap 10 tokenA to 10 tokenB (id = 0)
        await tokenA.mint(otherAccount.address, expandTo18Decimals(10));
        await tokenA.connect(otherAccount).approve(assetTrading.address, expandTo18Decimals(10));
        await assetTrading.connect(otherAccount).createAskTokensToTokens(
          tokenA.address,
          expandTo18Decimals(10),
          tokenB.address,
          expandTo18Decimals(10)
        );
        // create Pair swap 10 ETH to 10 tokenB (id = 1)
        await assetTrading.connect(otherAccount).createAskETHToTokens(
          tokenB.address,
          expandTo18Decimals(10), { value: expandTo18Decimals(10) }
        );
      });
      it("15. Should revert when insufficient allowance.", async function () {
        id = BN(0);
        amountBidOut = expandTo18Decimals(10);
        // no approve
        await expect(assetTrading.doBidTokens(
          id,
          amountBidOut
        )).to.be.revertedWith("ERC20: insufficient allowance");
        // approve insufficient
        await tokenB.approve(assetTrading.address, amountBidOut.sub(1));
        await expect(assetTrading.doBidTokens(
          id,
          amountBidOut
        )).to.be.revertedWith("ERC20: insufficient allowance");
      });
      it("16. Should revert when transfer amount exceeds balance.", async function () {
        id = BN(0);
        amountBidOut = expandTo18Decimals(10);
        await tokenB.transfer(otherAccount.address, await tokenA.balanceOf(owner.address));
        await tokenB.mint(owner.address, amountBidOut.sub(1));
        await tokenB.approve(assetTrading.address, amountBidOut);
        // doBid pair token to token
        await expect(assetTrading.doBidTokens(
          id,
          amountBidOut
        )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        // doBid pair ETH to token
        id = BN(1);
        expect(assetTrading.doBidTokens(
          id,
          amountBidOut
        )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      });
      it("17. Should do bid 5 tokenB swap 10 tokenA or 10 ETH.", async function () {

        amountBidOut = expandTo18Decimals(10);
        // doBid pair swap 10 tokenB to 10 tokenA
        id = BN(0);
        let pair = await assetTrading.getPairById(id);
        let balanceTokenAOfCallerBeforeDoBid = await tokenA.balanceOf(owner.address);
        let balanceTokenBOfCallerBeforeDoBid = await tokenB.balanceOf(owner.address);
        let balanceTokenBOfOwnerPairBeforeDoBid = await tokenB.balanceOf(pair._owner);

        await tokenB.approve(assetTrading.address, amountBidOut);
        await expect(assetTrading.doBidTokens(
          id,
          amountBidOut
        ))
          .to.emit(tokenB, 'Transfer').withArgs(owner.address, pair._owner, amountBidOut)
          .to.emit(assetTrading, 'DoBid').withArgs(owner.address, id, pair._asset_out._asset_address, expandTo18Decimals(10));

        // check balance token B after doBid
        expect(await tokenB.balanceOf(owner.address)).to.eq(balanceTokenBOfCallerBeforeDoBid.sub(amountBidOut));
        expect(await tokenB.balanceOf(pair._owner)).to.eq(balanceTokenBOfOwnerPairBeforeDoBid.add(amountBidOut));
        // check balance token A after doBid
        expect(await tokenA.balanceOf(owner.address)).to.eq(balanceTokenAOfCallerBeforeDoBid.add(expandTo18Decimals(10)));
        // check status pair
        expect((await assetTrading.getPairById(id))._is_finished).to.eq(true);

        // doBid pair swap 10 tokenB to 10 ETH
        id = BN(1);
        pair = await assetTrading.getPairById(id);;
        balanceTokenBOfCallerBeforeDoBid = await tokenB.balanceOf(owner.address);
        balanceTokenBOfOwnerPairBeforeDoBid = await tokenB.balanceOf(pair._owner);
        let tx;
        let gasUsed: BigNumber;
        await tokenB.approve(assetTrading.address, amountBidOut);
        let balanceETHOfOwnerPairBeforeDoBid: BigNumber = await owner.getBalance();
        await expect(tx = await assetTrading.doBidTokens(
          id,
          amountBidOut
        ))
          .to.emit(tokenB, 'Transfer').withArgs(owner.address, pair._owner, amountBidOut)
          .to.emit(assetTrading, 'DoBid').withArgs(owner.address, id, pair._asset_out._asset_address, expandTo18Decimals(10));

        // check balance token B after doBid
        expect(await tokenB.balanceOf(owner.address)).to.eq(balanceTokenBOfCallerBeforeDoBid.sub(amountBidOut));
        expect(await tokenB.balanceOf(pair._owner)).to.eq(balanceTokenBOfOwnerPairBeforeDoBid.add(amountBidOut));

        // check balance ETH after doBid
        gasUsed = (await tx.wait()).gasUsed;
        expect(await owner.getBalance()).to.eq(balanceETHOfOwnerPairBeforeDoBid.add(expandTo18Decimals(10)).sub(gasUsed));
        // check status pair
        expect((await assetTrading.getPairById(id))._is_finished).to.eq(true);
      });
    });
  });

  describe("11. doBidETH", async function () {
    let id: BigNumber;
    let amountBidOut: BigNumber;
    it("1. Should throw error when Pair ID < 0", async function () {
      id = BN(-1);
      amountBidOut = BN(1);
      expect(assetTrading.doBidETH(
        id, { value: amountBidOut }
      )).to.be.throws;
    });
    it("2. Should throw error when Pair ID > maxUint256", async function () {
      id = maxUint256.add(1);
      amountBidOut = BN(1);
      expect(assetTrading.doBidETH(
        id, { value: amountBidOut }
      )).to.be.throws;
    });
    it("3. Should throw error when value (ETH) < 0", async function () {
      id = BN(0);
      amountBidOut = BN(-1);
      expect(assetTrading.doBidETH(
        id, { value: amountBidOut }
      )).to.be.throws;
    });
    it("4. Should throw error when value (ETH) > maxUint256", async function () {
      id = BN(0);
      amountBidOut = maxUint256.add(1);
      expect(assetTrading.doBidETH(
        id, { value: amountBidOut }
      )).to.be.throws;
    });
    it("5. Should throw error when transfer amount exceeds balance.", async function () {
      id = BN(0);
      amountBidOut = await owner.getBalance();
      expect(assetTrading.doBidETH(
        id, { value: amountBidOut }
      )).to.be.throws;
    });
    it("6. Should revert when value (ETH) = 0", async function () {
      id = BN(0);
      amountBidOut = BN(0);
      await expect(assetTrading.doBidETH(
        id, { value: amountBidOut }
      )).to.be.revertedWith("AssetTrading: INVALID_AMOUNT");
    });
    it("7. Should revert when pair ID > pairs.length", async function () {
      id = await assetTrading.pairs.length;
      amountBidOut = expandTo18Decimals(10);
      await expect(assetTrading.doBidETH(
        id, { value: amountBidOut }
      )).to.be.revertedWith("AssetTrading: ID_OUT_RANGE");
    });
    it("8. Should revert when pair ID is not active", async function () {
      // create pair example swap 10 tokenA to 10 ETH and remove it
      const createPairExampleAndRemoveIt = async () => {
        // create pair id = 0
        await tokenA.approve(assetTrading.address, expandTo18Decimals(10));
        await assetTrading.createAskTokensToETH(tokenA.address, expandTo18Decimals(10), expandTo18Decimals(10));
        // remove pair
        await assetTrading.removeAsk(0);
      }
      await createPairExampleAndRemoveIt();
      id = BN(0);
      amountBidOut = expandTo18Decimals(10);
      await expect(assetTrading.doBidETH(
        id, { value: amountBidOut }
      )).to.be.revertedWith("AssetTrading: ASK_FINISHED");
    });
    it("9. Should revert when pair has type of assetIn is not ETH", async function () {
      // create pair example with type assetIn is ERC20
      const createPairExample = async () => {
        // create pair id = 0
        await tokenA.approve(assetTrading.address, await tokenA.balanceOf(owner.address));
        await assetTrading.createAskTokensToTokens(tokenA.address, expandTo18Decimals(10), tokenB.address, expandTo18Decimals(10));
      }
      await createPairExample();
      id = BN(0);
      amountBidOut = expandTo18Decimals(10);
      await expect(assetTrading.doBidETH(
        id, { value: amountBidOut }
      )).to.be.revertedWith("AssetTrading: INVALID_PAIR_ID");
    });
    it("10. Should revert when value (ETH) > amountIn", async function () {
      // create pair example 
      const createPairExample = async () => {
        // create pair id = 0
        await tokenA.approve(assetTrading.address, await tokenA.balanceOf(owner.address));
        await assetTrading.createAskTokensToETH(tokenA.address, expandTo18Decimals(10), expandTo18Decimals(10));
      }
      await createPairExample();
      id = BN(0);
      amountBidOut = expandTo18Decimals(11);
      await expect(assetTrading.doBidETH(
        id, { value: amountBidOut }
      )).to.be.revertedWith("AssetTrading: EXCESSIVE_AMOUNT");
    });
    describe("when assetOut is ERC721", async function () {
      beforeEach(async function () {
        // create Pair swap 1 NFTsA to 10 ETH
        await nftA.safeMint(otherAccount.address);
        await nftA.connect(otherAccount).setApprovalForAll(assetTrading.address, true);
        await assetTrading.connect(otherAccount).createAskNFTToETH(
          nftA.address,
          0,
          expandTo18Decimals(10)
        );
      });
      it("11. Should revert when amountBidOut != amountIn", async function () {
        id = BN(0);
        amountBidOut = expandTo18Decimals(9);
        await expect(assetTrading.doBidETH(
          id, { value: amountBidOut }
        )).to.be.revertedWith("AssetTrading: INCORRECT_AMOUNT");
      });
      it("12. Should do bid 10 ETH swap 1 NFTsA.", async function () {
        id = BN(0);
        amountBidOut = expandTo18Decimals(10);

        let pair = await assetTrading.getPairById(id);
        let tx;
        let gasUsed: BigNumber;
        let balanceETHOfCallerBeforeDoBid = await owner.getBalance();
        let balanceETHOfOwnerPairBeforeDoBid = await otherAccount.getBalance();
        await expect(tx = await assetTrading.doBidETH(
          id, { value: amountBidOut }
        ))
          .to.emit(assetTrading, 'DoBid').withArgs(owner.address, id, pair._asset_out._asset_address, pair._asset_out._token_id);

        // check balance ETH after doBid
        gasUsed = (await tx.wait()).gasUsed;
        expect(await owner.getBalance()).to.eq(balanceETHOfCallerBeforeDoBid.sub(amountBidOut).sub(gasUsed));
        expect(await otherAccount.getBalance()).to.eq(balanceETHOfOwnerPairBeforeDoBid.add(amountBidOut));
        // check owner NFT
        expect(await nftA.ownerOf(pair._asset_out._token_id)).to.eq(owner.address);
        // check status pair
        expect((await assetTrading.getPairById(id))._is_finished).to.eq(true);
      });
    });
    describe("when assetOut is ERC20", async function () {
      beforeEach(async function () {
        // create Pair swap 10 tokenA to 10 ETH (id = 0)
        await tokenA.mint(otherAccount.address, expandTo18Decimals(10));
        await tokenA.connect(otherAccount).approve(assetTrading.address, expandTo18Decimals(10));
        await assetTrading.connect(otherAccount).createAskTokensToETH(
          tokenA.address,
          expandTo18Decimals(10),
          expandTo18Decimals(10)
        );
      });
      it("13. Should do bid 10 ETH swap 10 tokenA", async function () {
        id = BN(0);
        amountBidOut = expandTo18Decimals(10);
        let pair = await assetTrading.getPairById(id);
        let tx;
        let gasUsed: BigNumber;
        let balanceTokenAOfCallerBeforeDoBid = await tokenA.balanceOf(owner.address);
        let balanceETHOfCallerBeforeDoBid = await owner.getBalance();
        let balanceETHOfOwnerPairBeforeDoBid = await otherAccount.getBalance();
        await expect(tx = await assetTrading.doBidETH(
          id, { value: amountBidOut }
        ))
          .to.emit(assetTrading, 'DoBid').withArgs(owner.address, id, pair._asset_out._asset_address, expandTo18Decimals(10));

        // check balance ETH after doBid
        gasUsed = (await tx.wait()).gasUsed;
        expect(await owner.getBalance()).to.eq(balanceETHOfCallerBeforeDoBid.sub(amountBidOut).sub(gasUsed));
        expect(await otherAccount.getBalance()).to.eq(balanceETHOfOwnerPairBeforeDoBid.add(amountBidOut));
        // check balance token A after doBid
        expect(await tokenA.balanceOf(owner.address)).to.eq(balanceTokenAOfCallerBeforeDoBid.add(expandTo18Decimals(10)));
        // check status pair
        expect((await assetTrading.getPairById(id))._is_finished).to.eq(true);

      });
    }); 
  });
  describe("12. doBidNFT", async function () {
    let id: BigNumber;
    let nftIdBidOut: BigNumber;
    it("1. Should throw error when Pair ID < 0", async function () {
      id = BN(-1);
      nftIdBidOut = BN(1);
      expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut
      )).to.be.throws;
    });
    it("2. Should throw error when Pair ID > maxUint256", async function () {
      id = maxUint256.add(1);
      nftIdBidOut = BN(1);
      expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut
      )).to.be.throws;
    });
    it("3. Should throw error when NFT ID Bid Out < 0", async function () {
      id = BN(0);
      nftIdBidOut = BN(-1);
      expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut
      )).to.be.throws;
    });
    it("4. Should throw error when NFT ID Bid Out > maxUint256", async function () {
      id = BN(0);
      nftIdBidOut = maxUint256.add(1);
      expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut
      )).to.be.throws;
    });
    it("5. Should throw error when send transaction with value (ETH) != 0", async function () {
      id = BN(0);
      nftIdBidOut = BN(0);
      expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut, { value: BN(1) }
      )).to.be.throws;
    });
    it("6. Should revert when pair ID > pairs.length", async function () {
      id = await assetTrading.pairs.length;
      nftIdBidOut = BN(0);
      await expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut
      )).to.be.revertedWith("AssetTrading: ID_OUT_RANGE");
    });
    it("7. Should revert when pair ID is not active", async function () {
      // create pair example swap 10 tokenA to 1 NFTsA and remove it
      const createPairExampleAndRemoveIt = async () => {
        // create pair id = 0
        await nftA.safeMint(otherAccount.address);
        await tokenA.approve(assetTrading.address, expandTo18Decimals(10));
        await assetTrading.createAskTokensToNFT(tokenA.address, expandTo18Decimals(10), nftA.address, BN(0));
        // remove pair
        await assetTrading.removeAsk(0);
      }
      await createPairExampleAndRemoveIt();
      id = BN(0);
      nftIdBidOut = BN(0);
      await expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut
      )).to.be.revertedWith("AssetTrading: ASK_FINISHED");
    });
    it("8. Should revert when pair has type of assetIn is not ERC721", async function () {
      // create pair example with type assetIn is ERC20
      const createPairExample = async () => {
        // create pair id = 0
        await tokenA.approve(assetTrading.address, await tokenA.balanceOf(owner.address));
        await assetTrading.createAskTokensToTokens(tokenA.address, expandTo18Decimals(10), tokenB.address, expandTo18Decimals(10));
      }
      await createPairExample();
      id = BN(0);
      nftIdBidOut = BN(0);
      await expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut
      )).to.be.revertedWith("AssetTrading: INVALID_PAIR_ID");
    });
    it("9. Should revert when NFT ID Bid Out != NFT ID Bid In", async function () {
      // create pair example swap 10 tokenA to 1 NFTsA
      const createPairExample = async () => {
        // create pair id = 0
        await nftA.safeMint(otherAccount.address);
        await tokenA.approve(assetTrading.address, expandTo18Decimals(10));
        await assetTrading.createAskTokensToNFT(tokenA.address, expandTo18Decimals(10), nftA.address, BN(0));
      }
      await createPairExample();
      id = BN(0);
      nftIdBidOut = BN(1);
      await nftA.safeMint(owner.address);
      await expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut
      )).to.be.revertedWith("AssetTrading: INCORRECT_TOKEN_ID");
    });
    it("10. Should revert when NFT ID Bid Out is not exist", async function () {
      // create pair example swap 10 tokenA to 1 NFTsA
      const createPairExample = async () => {
        // create pair id = 0
        await nftA.safeMint(otherAccount.address);
        await tokenA.approve(assetTrading.address, expandTo18Decimals(10));
        await assetTrading.createAskTokensToNFT(tokenA.address, expandTo18Decimals(10), nftA.address, BN(0));
      }
      await createPairExample();
      id = BN(0);
      nftIdBidOut = BN(0);
      await nftA.connect(otherAccount).burn(nftIdBidOut);
      await expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut
      )).to.be.revertedWith("ERC721: invalid token ID");
    });
    it("11. Should revert when caller is not owner NFT ID Bid Out", async function () {
      // create pair example swap 10 tokenA to 1 NFTsA
      const createPairExample = async () => {
        // create pair id = 0
        await nftA.safeMint(otherAccount.address);
        await tokenA.approve(assetTrading.address, expandTo18Decimals(10));
        await assetTrading.createAskTokensToNFT(tokenA.address, expandTo18Decimals(10), nftA.address, BN(0));
      }
      await createPairExample();
      id = BN(0);
      nftIdBidOut = BN(0);
      await expect(assetTrading.doBidNFT(
        id,
        nftIdBidOut
      )).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
    it("12. Should revert when caller is not approve NFT ID Bid Out", async function () {
      // create pair example swap 10 tokenA to 1 NFTsA
      const createPairExample = async () => {
        // create pair id = 0
        await nftA.safeMint(otherAccount.address);
        await tokenA.approve(assetTrading.address, expandTo18Decimals(10));
        await assetTrading.createAskTokensToNFT(tokenA.address, expandTo18Decimals(10), nftA.address, BN(0));
      }
      await createPairExample();
      id = BN(0);
      nftIdBidOut = BN(0);
      await expect(assetTrading.connect(otherAccount).doBidNFT(
        id,
        nftIdBidOut
      )).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
    it("13. Should doBid pair swap 10 tokenA to 1 NFTsA", async function () {
      // create pair example swap 10 tokenA to 1 NFTsA
      const createPairExample = async () => {
        // create pair id = 0
        await nftA.safeMint(otherAccount.address);
        await tokenA.approve(assetTrading.address, expandTo18Decimals(10));
        await assetTrading.createAskTokensToNFT(tokenA.address, expandTo18Decimals(10), nftA.address, BN(0));
      }
      await createPairExample();
      id = BN(0);
      nftIdBidOut = BN(0);
      let pair = await assetTrading.getPairById(id);
      await nftA.connect(otherAccount).setApprovalForAll(assetTrading.address, true);
      await expect(assetTrading.connect(otherAccount).doBidNFT(
        id,
        nftIdBidOut
      ))
        .to.emit(nftA, 'Transfer').withArgs(otherAccount.address, owner.address, nftIdBidOut)
        .to.emit(tokenA, 'Transfer').withArgs(assetTrading.address, otherAccount.address, pair._asset_out._amount)
        .to.emit(assetTrading, 'DoBid').withArgs(otherAccount.address, id, pair._asset_out._asset_address, pair._asset_out._amount);
    });
  });
});

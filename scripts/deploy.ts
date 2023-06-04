import { ethers, run } from "hardhat";
import { writeFile } from "fs/promises";

async function main() {

  const AssetTrading = await ethers.getContractFactory("AssetTrading");
  const assetTrading = await AssetTrading.deploy();

  await assetTrading.deployed();
  if (assetTrading.address) {
    await run("verify:verify",
      {
        address: assetTrading.address
      }).catch(e => console.log(e.message));
  }
  await writeFile('scripts/contract-address.json', JSON.stringify({
    "AssetTrading": assetTrading.address
  }));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

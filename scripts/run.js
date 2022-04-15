/**
 * Compile it.
 * Deploy it to our local blockchain.
 * Once it's there, that console.log will run.
 */
const main = async () => {
  const nftContractFactory = await hre.ethers.getContractFactory("KMBContract");

  const nftContract = await nftContractFactory.deploy("ipfs/QmPSHvkdFgBc3maEPtCeidczQE6NkwESiKLfMEgpWigBsn/", "ipfs/QmWruc1JKgg74zU22GSm38EA6oHCEJ9DcBZSThEPKuXvnj/hidden.json");

  //We'll wait until our contract is officially mined and deployed to our local blockchain!
  // hardhat actually creates faker "miners" on your machine to try its best to imitate the actual blockchain.
  await nftContract.deployed();

  let txn = await nftContract.mint(1);
  await txn.wait();
  console.log("Minted one NFT");

  txn = await nftContract.mint(1);
  await txn.wait();
  console.log("Minted another NFT");
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();

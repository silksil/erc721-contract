const deploymentVariables = require("../deploymentVariables.js");

const main = async () => {
  const contractFactory = await hre.ethers.getContractFactory("KMBContractSimple");
  // include the base Uri with forward slash at the end.
  const contract = await contractFactory.deploy();
  await contract.deployed();

  console.log("contract deployed to:", contract.address);
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

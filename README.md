# Abi file

The contents of the ABI file can be found in a JSON file in your hardhat project:
`artifacts/contracts/%{name}.sol/${name}.json`

#### Interact with contract on etherscan

# 1. Deploy

1. Define the name of the contract in the file NftContract as `${nameProject}Contract`
2. Include the Name and Symbol in the contructor. => we include this here instead of as arguments because it makes it easier for Etherscan verification
3. Pass the arguments as an array in `deploymentVariables`: [ baseUri, hiddenJsonUri ]
4. In the `deploy.js` pass the name of the contract to the function `getContractFactory`.
5. Run `yarn deploy ${nameNetwork}`

# 2. Copy abi file

The contents of the ABI file can be found in a JSON file in your hardhat project:
`artifacts/contracts/%{fileName}.sol/${contractName}.json`

# 3. Verify code on Etherscan

1. Go to [https://etherscan.io](https://etherscan.io/register) , head to your profile settings and under `API_KEYS` create a new apiKey.
2. Head back to your `hardhat.config.js` file and change the `apiKey` property to be your newly generated key.
3. Update the arguments that you passed to the contract in `deploy.js` in `etherscan.js`.
4. Run the command `yarn hardhat verify --constructor-args deploymentVariables.js --network rinkeby CONTRACT_ADDRESS`
5. If you experience errors `yarn hardhat clean` might help.

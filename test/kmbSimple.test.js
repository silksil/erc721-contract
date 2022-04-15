const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");

chai.use(solidity);
const { expect } = chai;

describe("KMBContractSimple", () => {
  let contract;
  const name = "KMB vs Vladimir";
  const symbol = "KMB";
  const uriPrefix = "ipfs://bafybeicgps4q7dzncngjydtnuczy4k7azmzprwrpbyg2z7fi7g7mfu3b24/json/";
  const uriSuffix = ".json";
  const maxSupply = 3333;
  const maxMintAmountPerTx = 5;
  const cost = ethers.utils.parseEther("0.02");
  let nonOwnerAddress;

  beforeEach(async () => {
    KMBContract = await ethers.getContractFactory("KMBContractSimple");
    [owner, nonOwner] = await ethers.getSigners();
    contract = await KMBContract.deploy(uriPrefix);
    nonOwnerAddress = nonOwner.address;
  });

  describe("the default variables", () => {
    it("should have the correct name and symbol ", async () => {
      expect(await contract.name()).to.equal(name);
      expect(await contract.symbol()).to.equal(symbol);
    });

    it("should have the correct uri values", async () => {
      expect(await contract.uriPrefix()).to.equal(uriPrefix);
      expect(await contract.uriSuffix()).to.equal(".json");
    });

    it("should have the correct max supply and max mint amounnt", async () => {
      expect(await contract.maxSupply()).to.equal(maxSupply);
      expect(await contract.maxMintAmountPerTx()).to.equal(maxMintAmountPerTx);
    });

    it("should have the correct cost", async () => {
      const contractCost = await contract.cost();
      expect(contractCost).to.equal(cost);
    });

    it("should be paused", async () => {
      expect(await contract.paused()).to.equal(true);
    });
  });

  describe("public functions", () => {
    describe("owners", () => {
      it("mint function will loop and mint appropriate amount of tokens for owners and nonOwners", async () => {
        await contract.setPaused(false);

        // mint 5 contracts and check whether balannce and balance is updated
        await contract.mint(5, { value: (cost * 5).toString() });
        expect(await contract.totalSupply()).to.equal(5);
        // mint another 4 tokensby non-onwer and check whether balannce and balance is updated
        await contract.connect(nonOwner).mint(4, { value: (cost * 4).toString() });
        expect(await contract.totalSupply()).to.equal(9);
      });

      it("mint function will not mint more than max supply", async () => {
        await contract.setPaused(false);

        for (i = 0; i < maxSupply; i++) {
          await contract.mint(1, { value: (cost * 1).toString() });
          // const tokenIndex = await token.totalSupply();
          // console.log(`Minted token index ${tokenIndex}`);
        }
        expect(await contract.totalSupply()).to.equal(maxSupply);
        await expect(contract.mint(1, { value: (cost * 1).toString() })).to.be.revertedWith("Max supply exceeded");
      }).timeout(150000);

      it("mint function will revert if max mint amount per tx is exceeded", async () => {
        await expect(contract.mint(6, { value: (cost * 5).toString() })).to.be.revertedWith("Invalid amount");
      });

      it("mint function will revert if not enough ETH sent", async () => {
        await contract.setPaused(false);
        await expect(contract.mint(5, { value: (cost * 1).toString() })).to.be.revertedWith("Insuf fund");
      });

      it("tokenURI function should return URI when a minted token Id is passed", async () => {
        await contract.mintForAddress(1, nonOwnerAddress);
        expect(await contract.tokenURI(1)).to.equal(`${uriPrefix}${"1"}${uriSuffix}`);
      });

      it.skip("tokenURI function should revert when a minted token Id is passed that is not minted.", async () => {
        expect(await contract.tokenURI(11111)).to.be.revertedWith("URI query for nonexistent token");
      });

      it("walletOfOwner function should returns tokenId's when accounnt address is passed that owns a token", async () => {
        await contract.mintForAddress(1, nonOwnerAddress);
        const walletOfOwner = await contract.walletOfOwner(nonOwnerAddress);
        expect(walletOfOwner[0]).to.equal(1);
      });

      it("walletOfOwner function should an empty array  when account address is passed that does not own any tokens", async () => {
        const walletOfOwner = await contract.walletOfOwner(nonOwnerAddress);
        expect(walletOfOwner.length).to.equal(0);
      });
    });
  });

  describe("owner can use", () => {
    it("setUriPrefix function to set new uriPrefix", async () => {
      await contract.setUriPrefix("ipfs://testuri");
      expect(await contract.uriPrefix()).to.equal("ipfs://testuri");
    });

    it("send funds", async () => {
      await contract.setPaused(false);
      const startingBalanceOwner = ethers.utils.formatEther(await owner.getBalance());
      expect(startingBalanceOwner).equal("0.0");

      await contract.connect(nonOwner).mint(4, { value: (cost * 4).toString() });
      await contract.send();
      const balanceOwner = ethers.utils.formatEther(await owner.getBalance());
      expect(balanceOwner).to.equal("0.08");

      await contract.mint(2, { value: (cost * 2).toString() });
      await contract.send();
      expect(ethers.utils.formatEther(await owner.getBalance())).equal("0.12");
    });

    it("function mintForAddress should mint transfer ownership to passed address", async () => {
      await contract.mintForAddress(1, nonOwnerAddress);
      expect(await contract.ownerOf(1)).to.equal(nonOwnerAddress);
      await contract.mintForAddress(2, nonOwnerAddress);
      expect(await contract.ownerOf(2)).to.equal(nonOwnerAddress);
      expect(await contract.ownerOf(3)).to.equal(nonOwnerAddress);
    });
  });

  describe("non owners cannot use ", () => {
    it("setPaused function to set pauzed var to false", async () => {
      await expect(contract.connect(nonOwner).setPaused(false)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("setUriPrefix function to set new uriPrefix", async () => {
      await expect(contract.connect(nonOwner).setUriPrefix("test")).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sendfunds", async () => {
      await expect(contract.connect(nonOwner).send()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("function mintForAddress should mint transfer ownership to passed address", async () => {
      await expect(contract.connect(nonOwner).mintForAddress(1, nonOwnerAddress)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

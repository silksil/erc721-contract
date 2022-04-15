const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");

chai.use(solidity);
const { expect } = chai;

describe("KMBContract", () => {
  let contract;
  const name = "KMB vs Vladimir";
  const symbol = "KMB";
  const uriPrefix = "ipfs://bafybeicgps4q7dzncngjydtnuczy4k7azmzprwrpbyg2z7fi7g7mfu3b24/json/";
  const uriSuffix = ".json";
  const hiddenMetadataUri = "ipfs://bafkreieixb5lb7kkzzogzrehxx6kh53233j2o554v6yx4dc6igw3lwn55i";
  const maxSupply = 3333;
  const maxMintAmountPerTx = 5;
  const cost = ethers.utils.parseEther("0.01");
  let nonOwnerAddress;

  beforeEach(async () => {
    KMBContract = await ethers.getContractFactory("KMBContract");
    [owner, nonOwner] = await ethers.getSigners();
    contract = await KMBContract.deploy(uriPrefix, hiddenMetadataUri);
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
      expect(await contract.hiddenMetadataUri()).to.equal(hiddenMetadataUri);
    });

    it("should have the correct max supply and max mint amounnt", async () => {
      expect(await contract.maxSupply()).to.equal(maxSupply);
      expect(await contract.maxMintAmountPerTx()).to.equal(maxMintAmountPerTx);
    });

    it("should have the correct cost", async () => {
      const contractCost = await contract.cost();
      expect(contractCost).to.equal(cost);
    });

    it("should not be paused and revealed", async () => {
      expect(await contract.revealed()).to.equal(true);
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
        expect(await contract.getBalance()).to.be.equal(ethers.utils.parseEther("0.05"));

        // mint another 4 tokensby non-onwer and check whether balannce and balance is updated
        await contract.connect(nonOwner).mint(4, { value: (cost * 4).toString() });
        expect(await contract.totalSupply()).to.equal(9);
        expect(await contract.getBalance()).to.be.equal(ethers.utils.parseEther("0.09"));
      });

      it.skip("mint function will not mint more than max supply", async () => {
        await contract.setPaused(false);
        for (i = 0; i < maxSupply; i++) {
          await contract.mint(1, { value: (cost * 1).toString() });
          // const tokenIndex = await token.totalSupply();
          // console.log(`Minted token index ${tokenIndex}`);
        }
        expect(await contract.totalSupply()).to.equal(maxSupply);
        await expect(contract.mint(1, { value: (cost * 1).toString() })).to.be.revertedWith("Max supply exceeded!");
      }).timeout(150000);

      it("mint function will revert if max mint amount per tx is exceeded", async () => {
        await contract.setPaused(false);
        await expect(contract.mint(6, { value: (cost * 5).toString() })).to.be.revertedWith("Invalid mint amount!");
      });

      it("mint function will revert if paused is true", async () => {
        await contract.setPaused(true);
        await expect(contract.mint(5, { value: (cost * 5).toString() })).to.be.revertedWith("The contract is paused!");
      });

      it("mint function will revert if not enough ETH sent", async () => {
        await contract.setPaused(false);
        await expect(contract.mint(5, { value: (cost * 1).toString() })).to.be.revertedWith("Insufficient funds!");
      });

      it("tokenURI function should return URI when a minted token Id is passed and revealed is true.", async () => {
        await contract.mintForAddress(1, nonOwnerAddress);
        expect(await contract.tokenURI(1)).to.equal(`${uriPrefix}${"1"}${uriSuffix}`);
      });

      it("tokenURI function should return hiddenMetadataUri when a minted token Id is passed and 'revealed' is false.", async () => {
        await contract.setRevealed(false);
        await contract.mintForAddress(1, nonOwnerAddress);
        expect(await contract.tokenURI(1)).to.equal(hiddenMetadataUri);
      });

      it.skip("tokenURI function should revert when a minted token Id is passed that is not minted.", async () => {
        expect(await contract.tokenURI(4444)).to.be.revertedWith("URI query for nonexistent token");
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
    it("setPaused function to set pauzed var to false", async () => {
      await contract.setPaused(false);
      expect(await contract.paused()).to.equal(false);
    });

    it("setRevealed function to set revealed var to true", async () => {
      await contract.setRevealed(true);
      expect(await contract.revealed()).to.equal(true);
    });

    it("setUriSuffix function to set new uriSuffix", async () => {
      await contract.setUriSuffix(".js");
      expect(await contract.uriSuffix()).to.equal(".js");
    });

    it("setUriPrefix function to set new uriPrefix", async () => {
      await contract.setUriPrefix("ipfs://testuri");
      expect(await contract.uriPrefix()).to.equal("ipfs://testuri");
    });
    it("setHiddenMetadataUri to set new hiddenMetadataUri", async () => {
      await contract.setHiddenMetadataUri("ipfs://testMetaUri");
      expect(await contract.hiddenMetadataUri()).to.equal("ipfs://testMetaUri");
    });
    it("setCost function will set new cost", async () => {
      const newCost = "800000000000000000";
      await contract.setCost(newCost);
      expect(await contract.cost()).to.equal(newCost);
    });
    it("setMaxMintAmountPerTx function to set new maxMintAmountPerTx", async () => {
      await contract.setMaxMintAmountPerTx(4);
      expect(await contract.maxMintAmountPerTx()).to.equal(4);
    });

    it("send funds", async () => {
      const receiver = await ethers.getSigner("0x633b7218644b83d57d90e7299039ebab19698e9c");

      const startingBalanceReceiver = ethers.utils.formatEther(await receiver.getBalance());
      expect(startingBalanceReceiver).equal("0.0");

      await contract.setPaused(false);
      await contract.connect(nonOwner).mint(4, { value: (cost * 4).toString() });
      await contract.send();
      const balanceReciever = ethers.utils.formatEther(await receiver.getBalance());
      expect(balanceReciever).to.equal("0.04");

      await contract.mint(2, { value: (cost * 2).toString() });
      await contract.send();
      expect(ethers.utils.formatEther(await receiver.getBalance())).equal("0.06");
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
    it("setRevealed function to set revealed var to true", async () => {
      await expect(contract.connect(nonOwner).setRevealed(true)).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("setUriSuffix function to set new uriSuffix", async () => {
      await expect(contract.connect(nonOwner).setUriSuffix(".js")).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("setUriPrefix function to set new uriPrefix", async () => {
      await expect(contract.connect(nonOwner).setUriPrefix("test")).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("setHiddenMetadataUri to set new hiddenMetadataUri", async () => {
      await expect(contract.connect(nonOwner).setHiddenMetadataUri("ipfs://testMetaUri")).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("setCost function will set new cost", async () => {
      const newCost = "800000000000000000";
      await expect(contract.connect(nonOwner).setCost(newCost)).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("setMaxMintAmountPerTx function to set new maxMintAmountPerTx", async () => {
      await expect(contract.connect(nonOwner).setMaxMintAmountPerTx(4)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("sendfunds", async () => {
      await expect(contract.connect(nonOwner).send()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("function mintForAddress should mint transfer ownership to passed address", async () => {
      await expect(contract.connect(nonOwner).mintForAddress(1, nonOwnerAddress)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

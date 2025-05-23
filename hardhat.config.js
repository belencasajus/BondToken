require("dotenv").config();
require("@nomiclabs/hardhat-ethers");

const { API_URL} = process.env;


module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    sepolia: {
      url: API_URL     
    }
  }
};



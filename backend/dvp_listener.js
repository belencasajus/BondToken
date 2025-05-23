const { ethers } = require("ethers");
const mongoose   = require("mongoose");
require("dotenv").config();

const Bond  = require("./models/Bond");
const Trade = require("./models/Trade");

const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL);

async function handleDvP(seller, buyer, amount, price, event) {
  const rec = {
    contractAddress: event.address.toLowerCase(),
    seller:          seller.toLowerCase(),
    buyer:           buyer.toLowerCase(),
    amount:          ethers.utils.formatUnits(amount, 18),
    price:           ethers.utils.formatEther(price),
    txHash:          event.transactionHash,
    timestamp:       new Date()
  };
  try {
    await Trade.create(rec);
    console.log("DvP guardado:", rec.txHash);
  } catch (e) {
    if (e.code === 11000) console.warn("Tx ya registrada:", rec.txHash);
    else console.error("Error guardando trade:", e);
  }
}


function subscribeToDvP(address) {
  const contract = new ethers.Contract(
    address,
    ["event DvPTradeExecuted(address indexed seller,address indexed buyer,uint256 amount,uint256 price)"],
    provider
  );
  contract.on("DvPTradeExecuted", handleDvP);
  console.log("Suscrito dinámicamente a DvP de", address);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB conectado para DvP listener");

  const bonds = await Bond.find({});
  bonds.forEach(b => {
    const contract = new ethers.Contract(
      b.contractAddress,
      ["event DvPTradeExecuted(address indexed seller,address indexed buyer,uint256 amount,uint256 price)"],
      provider
    );

    contract.on("DvPTradeExecuted", async (seller, buyer, amount, price, event) => {
      const rec = {
        contractAddress: b.contractAddress.toLowerCase(), 
        seller:          seller.toLowerCase(),
        buyer:           buyer.toLowerCase(),
        amount:          ethers.utils.formatUnits(amount, 18),
        price:           ethers.utils.formatEther(price),
        txHash:          event.transactionHash,
        timestamp:       new Date()
      };
      
      try {
        await Trade.create(rec);
        console.log("DvP guardado:", rec.txHash);
      } catch (e) {
        console.error("Error al guardar trade:", e.message);
        if (e.code === 11000) {
          console.warn("Transacción ya registrada:", rec.txHash);
        } else {
          console.error("Error al guardar trade:", e.message);
        }
      }
    });

    console.log("Suscrito a DvP de bono:", b.name);
  });
}

main().catch(console.error);
module.exports = { subscribeToDvP };
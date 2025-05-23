const cron               = require("node-cron");
const mongoose           = require("mongoose");
const Bond               = require("./models/Bond");
const Trade              = require("./models/Trade");
const PendingPayment     = require("./models/PendingPayment");
require("dotenv").config();

const { BigNumber, constants, utils } = require("ethers");

const SECONDS_IN_YEAR = 365 * 24 * 3600;


mongoose.connect(process.env.MONGO_URI)

.then(() => console.log("MongoDB conectado para scheduler"))
.catch(err => console.error("Error MongoDB scheduler:", err));


async function doPayments() {
console.log("[SCHEDULER] doPayments() arrancado a las", new Date().toISOString());
  const now   = new Date();
  console.log("[scheduler] now =", now.toISOString());


  const dueCoupons = await Bond.find({
    nextCouponDate: { $lte: now },
    redeemed: false
  });
  console.log(`[SCHEDULER] bonos con cupón vencido: ${dueCoupons.length}`, dueCoupons.map(b=>b.contractAddress));

  for (let bond of dueCoupons) {
    if (!bond.couponInterval) continue;
    const bondAddr = bond.contractAddress.toLowerCase();
    console.log(`[SCHEDULER] procesando bono ${bondAddr}`);

   
    const holders = await Trade.aggregate([
    { $match: { contractAddress: bond.contractAddress.toLowerCase() } },
      { $group: {
          _id: "$buyer",
          totalTokens: { $sum: { $toDouble: "$amount" } }
        }
      }
    ]);
    console.log(`para bono ${bond.contractAddress} encontró ${holders.length} holders:`,
        holders.map(h=>h._id));

    for (let h of holders) {
      
      const balWei = utils.parseUnits(h.totalTokens.toString(), 18);

      
      const issuePriceWei = BigNumber.from(bond.issuePrice);

      
      const nominalWei = balWei.mul(issuePriceWei).div(constants.WeiPerEther);

      
      const couponWei = nominalWei
          .mul(bond.couponRate)           
          .mul(bond.couponInterval)       
          .div(100)                       
          .div(SECONDS_IN_YEAR);         

        await PendingPayment.create({
            bondAddress: bond.contractAddress,
            holder:      h._id,
            amountWei: couponWei.toString(),
            type:        "coupon",
            issuer:      bond.issuerAddress    
          });
          
          

          console.log(
            `Cupón -> bono: ${bond.symbol}(${bond.contractAddress}), ` +
            `holder: ${h._id}, importe: ${utils.formatEther(couponWei)} ETH`
          );
    }

    
    bond.nextCouponDate = new Date(
      bond.nextCouponDate.getTime() + bond.couponInterval * 1000
    );
    await bond.save();
  }

  
  const nowSec    = Math.floor(now.getTime() / 1000);
  const dueRedemt = await Bond.find({
    maturityDate: { $lte: nowSec },
    redeemed:     false
  });

  for (let bond of dueRedemt) {
    const holders = await Trade.aggregate([
        { $match: { contractAddress: bond.contractAddress.toLowerCase() } },
      { $group: {
          _id: "$buyer",
          totalTokens: { $sum: { $toDouble: "$amount" } }
        }
      }
    ]);

    for (let h of holders) {
      
      const balWei = utils.parseUnits(h.totalTokens.toString(), 18);

     
      const issuePriceWei = BigNumber.from(bond.issuePrice);

      
      const capWei = balWei.mul(issuePriceWei).div(constants.WeiPerEther);

      await PendingPayment.create({
        bondAddress: bond.contractAddress.toLowerCase(),
        holder:      h._id.toLowerCase(),
        amountWei: capWei.toString(),
        type:        "redemption",
        issuer:      bond.issuerAddress?.toLowerCase() 
      });

      console.log(
        `Redención -> bono: ${bond.symbol}(${bond.contractAddress}), ` +
        `holder: ${h._id}, capital: ${utils.formatEther(capWei)} ETH`
      );
    }
    

     await Bond.updateOne(
         { _id: bond._id },
         {
           $set: {
             redeemed:        true,
             nextCouponDate:  null,
             couponInterval:  0,
           },
         },
         { runValidators: false }               
       );
  }
}


cron.schedule("0 0 * * *", () => {
  doPayments().catch(err => console.error("Error en doPayments:", err));
});

module.exports = { doPayments };

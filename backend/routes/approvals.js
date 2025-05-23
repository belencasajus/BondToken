const express   = require("express");
const router    = express.Router();
const Approval  = require("../models/Approval");
const { ethers } = require("ethers");

router.post("/requestTrade", async (req, res) => {
  let { bond, seller, buyer, amount, price } = req.body;
  if (!bond||!seller||!buyer||!amount||!price)
    return res.status(400).json({ error:"Faltan campos" });
  if (!ethers.utils.isAddress(seller) || !ethers.utils.isAddress(buyer) || !ethers.utils.isAddress(bond))
         return res.status(400).json({ error: "Dirección Ethereum no válida" });
       if (Number(amount) <= 0 || Number(price) <= 0)
         return res.status(400).json({ error: "Cantidad y precio deben ser mayores que cero" });

  bond   = bond.toLowerCase();
  seller = seller.toLowerCase();
  buyer  = buyer.toLowerCase();

  const bondContract = new ethers.Contract(
    bond,                       
    ["function redeemed() view returns (bool)"],
    new ethers.providers.JsonRpcProvider(process.env.API_URL)  
  );
  
   try {
       if (await bondContract.redeemed()) {
         return res.status(400).json({ error: "Bono redimido" });
       }
     } catch (e) {
       console.error("No se pudo comprobar redeemed():", e);
       return res.status(500).json({ error: "Error consultando el bono" });
     }

  
  if (seller === buyer)
    return res.status(400).json({ error:"No puedes comprarte a ti mismo" });

  const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL);
  const bal      = await provider.getBalance(buyer);
  if (bal.lt(ethers.BigNumber.from(price)))
    return res.status(400).json({ error:"ETH insuficiente" });

  try {
    await Approval.deleteMany({
      bond, seller, buyer,
      status: { $in: ["pending","approved"] }
    });

    const doc = await Approval.create({ bond,seller,buyer,amount,price });
    return res.json({ success:true, id: doc._id });
  } catch (err) {
    if (err.code===11000)
      return res.status(409).json({ error:"Solicitud ya pendiente" });
    console.error(err);
    return res.status(500).json({ error:"Error servidor" });
  }
});


router.get("/buyer/:buyer", async (req, res) => {
  const buyer = req.params.buyer.toLowerCase();
  const { id } = req.query;
  const q = { buyer, status:"approved" };
  if (id) q._id = id;
  const list = await Approval.find(q);
  res.json(list);
});

router.get("/:seller", async (req, res) => {
  const seller = req.params.seller.toLowerCase();
  const list = await Approval.aggregate([
    { $match: { seller, status:"pending" } },
    { $group: {
        _id: { bond:"$bond", buyer:"$buyer" },
        doc: { $first: "$$ROOT" }
      }
    },
    { $replaceRoot: { newRoot:"$doc" } },
    { $project: { bond:1, buyer:1, amount:1, price:1, createdAt:1 } }
  ]);
  res.json(list);
});

router.post("/:id/mark", async (req, res) => {
  await Approval.findByIdAndUpdate(req.params.id, { status:"approved" });
  res.json({ success:true });
});


router.delete("/:id", async (req, res) => {
  await Approval.findByIdAndDelete(req.params.id);
  res.json({ success:true });
});

module.exports = router;

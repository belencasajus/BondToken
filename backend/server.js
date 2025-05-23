const express  = require("express");
const path     = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const bondsRouter     = require("./routes/bonds");
const balancesRouter  = require("./routes/balances");
const tradesRouter    = require("./routes/trades");
const approvalsRouter = require("./routes/approvals");
const uploadRouter    = require("./routes/upload");
const paymentsRouter = require("./routes/payments");


const Bond           = require("./models/Bond");
const { doPayments } = require("./couponScheduler");


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => {
    console.error("Error conectando a MongoDB:", err);
    process.exit(1);
  });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/bonds",     bondsRouter);
app.use("/balances",  balancesRouter);
app.use("/trades",    tradesRouter);
app.use("/approvals", approvalsRouter);
app.use("/uploadPDF", uploadRouter);
app.use("/payments", paymentsRouter);




require("./dvp_listener");

require("./couponScheduler");


app.post("/admin/forceCoupon", async (req, res) => {
  console.log("[ADMIN] /admin/forceCoupon recibida, body =", req.body);
  const { contractAddress, months } = req.body;
  const bond = await Bond.findOne({
  contractAddress: new RegExp(`^${contractAddress}$`, "i")
});

  if (!bond) return res.status(404).json({ error: "No encontrado" });

  bond.nextCouponDate = new Date(Date.now());
  await bond.save();
  console.log("[ADMIN] Invocando doPayments()");
  await doPayments();
  res.json({ success: true });
});

app.post("/admin/forceRedemption", async (req, res) => {
  const { contractAddress } = req.body;

  const bond = await Bond.findOneAndUpdate(
    { contractAddress: new RegExp(`^${contractAddress}$`, "i") },
    { maturityDate: Math.floor(Date.now() / 1000) },
    { new: true, runValidators: false }      
  );

  if (!bond) return res.status(404).json({ error: "No encontrado" });

  await doPayments();                        
  res.json({ success: true });
});






const PORT = process.env.PORT||3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

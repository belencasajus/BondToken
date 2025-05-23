const express = require("express");
const multer  = require("multer");
const axios   = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const upload = multer();
const router = express.Router();

router.post("/", upload.single("bondPDF"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No se recibió ningún archivo" });

    const data = new FormData();
    data.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        maxBodyLength: Infinity,
        headers: {
          ...data.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`
        }
      }
    );

    res.json({ ipfsHash: response.data.IpfsHash });
  } catch (err) {
    console.error("Error al subir PDF a IPFS:", err.response?.data || err.message);
    res.status(500).json({ error: "Error al subir a IPFS" });
  }
});

module.exports = router;

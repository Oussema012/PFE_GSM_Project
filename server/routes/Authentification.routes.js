const authController = require("../controllers/AuthController");
const express = require('express');
const router = express.Router();



    router.post("/signup",authController.signup );
    router.post("/signin",authController.signin );



module.exports = router;
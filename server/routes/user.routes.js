const userController = require("../controllers/userController");

module.exports = (app) => {
  
  app.post("/signout", userController.signout);
  app.get("/api/users", userController.getAllUsers);               // get all users
  app.get("/api/technicians", userController.getAllTechnicians);   // get all technicians
  app.get("/api/technicians/:id", userController.getTechnicianById); // get technician by ID

};

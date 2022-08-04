const session = require("express-session");
const config = require("../config/config");
const express = require("express");
const auth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminControllers");
const multer = require("multer");
const path = require("path");
const admin_route = express();

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

// Set view engine
admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");
admin_route.use(session({ secret: config.sessionSecret }));
admin_route.use(session({ secret: config.sessionSecret }));

// Set static path
admin_route.use(express.static("public"));

// For uploading files to the server
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/userImages"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});
const upload = multer({ storage: storage });

admin_route.get("/", auth.isLogout, adminController.loadLogin);

admin_route.post("/", adminController.verifyLogin);

admin_route.get("/home", auth.isLogin, adminController.loadDashboard);

admin_route.get("/logout", auth.isLogin, adminController.logout);

admin_route.get("/forget", auth.isLogout, adminController.forgetLoad);

admin_route.post("/forget", adminController.forgetVerify);

admin_route.get(
  "/forget-password",
  auth.isLogout,
  adminController.forgetPasswordLoad
);

admin_route.post("/forget-password", adminController.resetPassword);

admin_route.get("/dashboard", auth.isLogin, adminController.adminDashboard);

admin_route.get("/new-user", auth.isLogin, adminController.newUserLoad);

admin_route.post("/new-user", upload.single("image"), adminController.addUser);

admin_route.get("/edit-user", auth.isLogin, adminController.editUserLoad);

admin_route.post("/edit-user", adminController.updateUser);

admin_route.get("/delete-user", adminController.deleteUser);

admin_route.get("*", (req, res) => {
  res.redirect("/admin");
});

module.exports = admin_route;

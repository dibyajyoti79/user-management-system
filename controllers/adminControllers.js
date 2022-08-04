const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const randomString = require("randomstring");
const { emailPassword, emailUser } = require("../config/config");
const nodemailer = require("nodemailer");

// For sending verification mail
const addUserMail = async (name, email, password, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
    const mailOptions = {
      from: emailUser,
      to: email,
      subject: "For verification mail",
      html:
        "<p> Hii " +
        name +
        ' please click here to <a href="http://localhost:3000/verify?id=' +
        user_id +
        '">Verify </a> your mail.</p> <br><br>Your password is : ' +
        password,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent- ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Hashing the password
const securePassword = async (password) => {
  try {
    const hashPassword = await bcrypt.hash(password, 10);
    return hashPassword;
  } catch (error) {
    console.log(error.message);
  }
};

// Load login page
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

// Verify Login
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      const isMatched = await bcrypt.compare(password, userData.password);
      if (isMatched) {
        if (userData.is_admin === 0) {
          res.render("login", { message: "Email and password is incorrect" });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("login", { message: "Email and password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Load admin dashboard
const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("home", { admin: userData });
  } catch (error) {
    console.log(error.message);
  }
};

// Logout admin
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

// Load forget password page
const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};

// For sending password reset mail
const sendPasswordResetMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
    const mailOptions = {
      from: emailUser,
      to: email,
      subject: "For Reset Password",
      html:
        "<p> Hii " +
        name +
        ' please click here to <a href="http://localhost:3000/admin/forget-password?token=' +
        token +
        '">Reset </a> your password.</p>',
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent- ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Verify forget email
const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (userData) {
      // console.log(userData);
      if (userData.is_admin === 0) {
        res.render("forget", { message: "Email is incorrect" });
      } else {
        const rString = randomString.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: rString } }
        );
        sendPasswordResetMail(userData.name, userData.email, rString);
        res.render("forget", {
          message: "Please Check your mail to reset your password",
        });
      }
    } else {
      res.render("forget", { message: "Email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// forgetPasswordLoad
const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("forget-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Token is invald." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const sPassword = await securePassword(password);
    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: sPassword, token: "" } }
    );
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

// admin Dashboard
const adminDashboard = async (req, res) => {
  try {
    const usersData = await User.find({ is_admin: 0 });
    res.render("dashboard", { users: usersData });
  } catch (error) {
    console.log(error.message);
  }
};

// load add new user page
const newUserLoad = async (req, res) => {
  try {
    res.render("new-user");
  } catch (error) {
    console.log(error.message);
  }
};
// ADD New User

const addUser = async (req, res) => {
  try {
    const { name, email, mno } = req.body;
    const image = req.file.filename;
    const password = randomString.generate(8);
    const sPassword = await securePassword(password);
    const user = new User({
      name: name,
      email: email,
      mobile: mno,
      image: image,
      password: sPassword,
      is_admin: 0,
    });
    const userData = await user.save();
    if (userData) {
      addUserMail(name, email, password, userData._id);
      res.redirect("/admin/dashboard");
    } else {
      res.render("new-user", { message: "Something went wrong..." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// edit uer functionality
const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("edit-user", { user: userData });
    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// update user
const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mno,
          is_varified: req.body.verify,
        },
      }
    );
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

// delete user
const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    const updatedData = await User.deleteOne({ _id: id });
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  adminDashboard,
  newUserLoad,
  addUser,
  editUserLoad,
  updateUser,
  deleteUser,
};

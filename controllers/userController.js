const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomString = require("randomstring");
const { emailUser, emailPassword } = require("../config/config");
const { render } = require("ejs");

// Hashing the password
const securePassword = async (password) => {
  try {
    const hashPassword = await bcrypt.hash(password, 10);
    return hashPassword;
  } catch (error) {
    console.log(error.message);
  }
};

// For sending verification mail
const sendVerificationMail = async (name, email, user_id) => {
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
        '">Verify </a> your mail.</p>',
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

// Load register page
const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};

// Insert user into database
const insertUser = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      image: req.file.filename,
      password: spassword,
      is_admin: 0,
    });

    // if user already exists
    const exists = await User.exists({
      $or: [{ email: req.body.email }, { mobile: req.body.mno }],
    });

    if (exists) {
      res.render("registration", {
        message: "This email or mobile number is already Exists",
      });
      return;
    }

    // Save user into database
    const userData = await user.save();

    if (userData) {
      sendVerificationMail(req.body.name, req.body.email, userData._id);
      res.render("registration", {
        message:
          "Your registration has been successfull, Please verify your email",
      });
    } else {
      res.render("registration", {
        message: "Your registration has been failed",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Verify mail
const verifyMail = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.query.id });
    let email;
    if(user.temp_email !== ""){
      email = user.temp_email;
    }else{
      email = user.email;
    }
    
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_varified: 1, email: email, temp_email: "", temp_verify: 0 } }
    );
    console.log(updateInfo);
    res.render("email-verified");
  } catch (error) {
    console.log(error.message);
  }
};

// Login user
const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

// Verify Login
const verifyLogin = async (req, res) => {
  try {
    const userData = await User.findOne({ email: req.body.email });

    if (userData) {
      const isMatched = await bcrypt.compare(
        req.body.password,
        userData.password
      );
      if (isMatched) {
        if (userData.is_varified === 1) {
          req.session.user_id = userData._id;
          res.redirect("/home");
        } else {
          res.render("login", { message: "Please verify your email" });
        }
      } else {
        res.render("login", { message: "Email and Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and Password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Load home page
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("homePage", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

// Logout user
const userLogout = async (req, res) => {
  try {
    const tempEmail = await User.findByIdAndUpdate(
      { _id: req.session.user_id },
      { $set: { temp_email: "", temp_verify: 0 } }
    );
    req.session.destroy();
    res.redirect("/");
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

// Verify forget email
const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (userData) {
      console.log(userData);
      if (userData.is_varified === 0) {
        res.render("forget", { message: "Please Verify your mail" });
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
      res.render("forget", { message: "User email is incorrect" });
    }
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
        ' please click here to <a href="http://localhost:3000/forget-password?token=' +
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
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

// For verification send mail link
const verificationLoad = async (req, res) => {
  try {
    res.render("verification");
  } catch (error) {
    console.log(error.message);
  }
};

const sendVeificationLink = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      sendVerificationMail(userData.name, userData.email, userData._id);
      res.render("verification", {
        message: "Verification mail send successfully, Please check your mail.",
      });
    } else {
      res.render("verification", { message: "Please enter correct email" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// user profile edit page
const editLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("edit", { user: userData });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.body.user_id });
    const preEmail = user.email;
    const currEmail = req.body.email;
    if (preEmail !== currEmail) {
      // if email already exists
      const exists = await User.exists({
        email: currEmail,
      });

      if (exists) {
        res.render("edit", {
          user: user,
          message: "Email address is already exist.",
        });
      } else {
        if (req.file) {
          const updateData = await User.findByIdAndUpdate(
            { _id: req.body.user_id },
            {
              $set: {
                name: req.body.name,
                temp_email: req.body.email,
                mobile: req.body.mno,
                image: req.file.filename,
                temp_verify: 1,
              },
            }
          );
        } else {
          const updateData = await User.findByIdAndUpdate(
            { _id: req.body.user_id },
            {
              $set: {
                name: req.body.name,
                temp_email: req.body.email,
                mobile: req.body.mno,
                temp_verify: 1,
              },
            }
          );
        }
        res.redirect("/home");
      }
    } else {
      if (req.file) {
        const updateData = await User.findByIdAndUpdate(
          { _id: req.body.user_id },
          {
            $set: {
              name: req.body.name,
              temp_email: req.body.email,
              mobile: req.body.mno,
              image: req.file.filename,
              temp_verify: 0,
            },
          }
        );
      } else {
        const updateData = await User.findByIdAndUpdate(
          { _id: req.body.user_id },
          {
            $set: {
              name: req.body.name,
              temp_email: req.body.email,
              mobile: req.body.mno,
              temp_verify: 0,
            },
          }
        );
      }
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Update email verify
const updateEmailVerify = async (req, res) => {
  try {
    const id = req.session.user_id;
    const user = await User.findOne({ _id: id });
    if (user) {
      if (user.is_varified === 1 && user.temp_verify === 0) {
        res.render("homePage", { user: user, message: "This Email is already verified" });
      } else {
        sendVerificationMail(user.name, user.temp_email, user._id);
        res.render("homePage", {
          message: "Verification link send succesfully, Please check your mail",user: user
        });
      }
    } else {
      res.render("homePage", { user: user, message: "Something went Wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadRegister,
  insertUser,
  verifyMail,
  loginLoad,
  verifyLogin,
  loadHome,
  userLogout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  verificationLoad,
  sendVeificationLink,
  editLoad,
  updateProfile,
  updateEmailVerify,
};

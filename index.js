const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

// Connect Database
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/user_management_system');

const express = require('express');
const app = express();

// app.use(express.json());

// for user routes
app.use('/',userRoute)

// for admin routes
app.use('/admin',adminRoute)



app.listen(3000, ()=>{
    console.log("server is running...")
})
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const User = require("./models/User");
const methodOverride = require("method-override");
const bcrypt = require("bcryptjs");

const { 
    checkAuthenticated , checkNotAuthenticated
} = require('./middleware/auth');

const app = express();

const initializePassport = require("./passport-config");
//const bcrypt = require("bcryptjs/dist/bcrypt");

initializePassport(
    passport,
    async(email) =>{
       const userFound = await User.findOne({ email });
       return userFound; 
    },
    async (id) => {
        const userFound = await User.findOne({ _id:id});
        return userFound;
    }
);

app.set("view engine" , "ejs");
app.use(express.urlencoded({ extended: true}));
app.use(flash()); 
app.use(session({
    secret : process.env.SESSION_SECRET,
    resave :false,
    saveUninitialized:false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(express.static('public'));

// app.set("views", "./views/");
// app.set('views', path.join(__dirname, "/views/"));

app.get("/", checkAuthenticated, (req,res)=>{
    res.render("index.ejs" , {name: req.user.name});
   //res.send("Page is working...")
})

app.get("/login", checkNotAuthenticated , (req,res)=>{
    res.render("login.ejs");
    //res.send("Login Page is working...")
});

app.post("/login" ,
     checkNotAuthenticated , 
     passport.authenticate("local", {
            successRedirect: "/",
            failureRedirect: "/login",
            failureFlash: true,
     })
);

app.post("/register" , checkNotAuthenticated , async(req,res) => {
    const userFound = await User.findOne({ email: req.body.email});

    if(userFound){
        req.flash("error" , "User with the email already exists");
        res.redirect("/register");
    }
    else
    {
        try {
           const  hashedPassword = await bcrypt.hash(req.body.password, 10)
           const user = new User({
               name : req.body.name,
               email : req.body.email,
               password: hashedPassword
           })

           await user.save();
           res.redirect("/login");
        } 
        catch (error) {
            console.log(error);
            res.redirect("/register");
        }
    }

})

app.delete("/logout" , (req,res) => {
    req.logOut();
    res.redirect("login");
})

 app.get("/register" , checkNotAuthenticated, (req,res) =>{
     res.render("register");
 })

mongoose.connect("mongodb://localhost:27017/Authentication" , {
    useNewUrlParser:true,
    useUnifiedTopology:true
}).then( ()=>{
    console.log("Database is connected..")
    app.listen(3000, ()=>{
        console.log("Server is listing on port 3000")
    });
}).catch((err) => {
    console.log(err);
});





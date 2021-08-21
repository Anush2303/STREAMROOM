  
require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy=require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate');
const app=express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const url=process.env.MONGODB_URL;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended:true
}));
app.use(session({
    secret:"OurLittlesecret",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(url,{useNewUrlParser:true, useUnifiedTopology:true});
const userSchema=new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    googleId: String

});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User=new mongoose.model("User",userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser(function(id,done){
    User.findById(id, function(err,user){
        done(err,user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/streamroom",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(token, tokenSecret, profile, done) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
          if(err)
          console.log(err)
          else
          return done(err, user);
      });
   }
));
app.get("/",function(req,res){
      res.sendFile('/streamroom.html',{root:__dirname});
});

app.get("/auth/google",passport.authenticate("google",{scope:["profile"]}));

app.get("/auth/google/streamroom",
 passport.authenticate("google",{failureRedirect:"/login"}),
 function(req,res){
     res.redirect("/landingpage");
 });

app.get("/signup",function(req,res){
      res.sendFile('/signup.html',{root:__dirname});
});
app.get("/login",function(req,res){
      res.sendFile('/loginindex.html',{root:__dirname});
});
app.get("/landingpage",function(req,res){
    if(req.isAuthenticated()){
          res.sendFile('/index1.html',{root:__dirname});
}
    else{
        res.redirect("/login");
    }
});
app.get("/chatpage",function(req,res){
    if(req.isAuthenticated()){
          res.sendFile('/chat.html',{root:__dirname});
}
    else{
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

app.post("/signup",function(req,res){
    console.log(req.body.username);
    User.register({username:req.body.username,email:req.body.email},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/signup");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/landingpage");
            });
        }
    });
});
app.post("/login",function(req,res){
    const user=new User({
        username:req.body.username,
         email:req.body.email,
        password:req.body.password
    });
    req.login(user,function(err){
        if(err)
        {
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/landingpage");
            });
        }
    });
});


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('join', function(room) {
        socket.join(room);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
      });
    socket.on('chat message', (msg) => {
        socket.broadcast.to(msg.room).emit('chat message', msg);
    });
  });

  io.on('connection',(socket)=>{
            socket.on("seek",(data)=>{
                    socket.to(data.room).emit('seek', data);
               })
            socket.on("upload",(data)=>{
                    console.log(data);
                    socket.to(data.room).emit('source', data);
             })
            socket.on("stream",(data)=>{
                if(data.message=='1'){
                    console.log(data);
                    socket.to(data.room).emit('stream', data);
                    }
                else if(data.message=='0'){
                    console.log(data);
                    socket.to(data.room).emit('stream', data);
                
                }
            })
  });
  
  server.listen(3000,function(){
    console.log("server started");
});
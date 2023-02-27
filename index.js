const express = require('express')
const passport = require('passport')

const cookieParser = require('cookie-parser')
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const DATA = [{email:"test@gmail.com", password:"1234"}]

const app = express()
app.use(express.urlencoded({ extended: false })) 
app.use(cookieParser())
app.use(passport.initialize());


const jwt = require('jsonwebtoken')
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = function(req) {
    var token = null;
    if (req && req.cookies)
    {
        token = req.cookies['jwt'];
    }
    return token;
};
opts.secretOrKey = 'secret';



passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    console.log("JWT BASED  VALIDATION GETTING CALLED")
    console.log("JWT", jwt_payload)
    if (CheckUser(jwt_payload.data)) {
        return done(null, jwt_payload.data)
    } else {
   
        return done(null, false);
    }
}));

passport.use(new GoogleStrategy({
    clientID: "116899161955996831498",
    clientSecret: "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDngqwiWNM/gtNV",
    callbackURL: "http://localhost:3000/googleRedirect"
  },
  function(accessToken, refreshToken, profile, cb) {
     
      console.log("GOOGLE BASED OAUTH VALIDATION GETTING CALLED")
      return cb(null, profile)
  }
));


passport.serializeUser(function(user, cb) {
    
    cb(null, user);
});
  
  passport.deserializeUser(function(obj, cb) {
    console.log('I wont have jack shit')
    cb(null, obj);
});
 
app.get('/', (req, res)=>{
    res.sendFile('home.html', {root: __dirname+'/public'})
})

app.get('/login', (req, res)=>{
    res.sendFile('login.html', {root: __dirname+'/public'})
})

app.get('/auth/email', (req, res)=>{
    res.sendFile('login_form.html',  {root: __dirname+'/public'})
})

app.get('/auth/google',  passport.authenticate('google', { scope: ['profile','email'] }))

app.post('/auth/email', (req, res)=>{
   
    if(CheckUser(req.body))
    {
        let token =    jwt.sign({
            data: req.body
            }, 'secret', { expiresIn: '1h' });
        res.cookie('jwt', token)
        res.send(`Log in success ${req.body.email}`)
    }else{
        res.send('Invalid login credentials')
    }
})

app.get('/profile', passport.authenticate('jwt', { session: false }) ,(req,res)=>{
    res.send(`THIS IS UR PROFILE MAAANNNN ${req.user.email}`)
})

app.get('/googleRedirect', passport.authenticate('google'),(req, res)=>{
    console.log('redirected', req.user)
    let user = {
        displayName: req.user.displayName,
        name: req.user.name.givenName,
        email: req.user._json.email,
        provider: req.user.provider }
    console.log(user)

    FindOrCreate(user)
    let token = jwt.sign({
        data: user
        }, 'secret', { expiresIn: '1h' });
    res.cookie('jwt', token)
    res.redirect('/')
})

function FindOrCreate(user){
    if(CheckUser(user)){  
        return user
    }else{
        DATA.push(user)
    }
}
function CheckUser(input){
    console.log(DATA)
    console.log(input)
  
    for (var i in DATA) {
        if(input.email==DATA[i].email && (input.password==DATA[i].password || DATA[i].provider==input.provider))
        {
            console.log('User found in DATA')
            return true
        }
        else
         null
            
      }
    return false
}
const port = process.env.PORT || 3000
app.listen( port, ()=>{
    console.log(`Sever runing on port ${port}`)
})
//app.js
//loaded package
//라우팅 및 서버생성에 필요한 패키지
var http = require('http');
var https = require('https');
var path = require('path');
var static = require('serve-static');
var express = require('express');
var bodyPaser = require('body-parser');
const userRoute = require('./route/user');
const userModel = require('./model/userModel');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const helmet = require('helmet');//웹서버와 클라이언트는 req,res로 받는데 해커가 이 과정에서 헤더를 가로챌 수 있기 떄문에 헤더를 보안해준다. 
const assert = require('assert');
const session = require('express-session');
const sessionStorage = require('node-sessionstorage');
const MongoDBStore = require('connect-mongodb-session')(session);


//mongoose 구동을 위한 패키지
const mongoose = require('mongoose');
const databaseurl = 'mongodb://sangeonpark:hang0513@ds249017.mlab.com:49017/heroku_9qww56hv'
 //const databaseurl = 'mongodb://localhost:27017/Thw2modimodi';
//const databaseurl = 'mongodb://https://git.heroku.com/sangeonpark.git'
console.log('connecting to the database!');
mongoose.Promise = global.Promise;
mongoose.connect(databaseurl);
const database = mongoose.connection;
database.on('error',console.error.bind(console,'mongoDB connection error')); 
console.log('connected to the database.');

//라우팅 및 서버생성에 필요한 패키지
var app = express();

//set up
app.set('port',process.env.PORT||8080);
app.set('views',__dirname+'/views');
app.set('view engine','ejs');

app.use(bodyPaser.urlencoded({extended : true}));
app.use(bodyPaser.json());
app.use(static(path.join(__dirname,'/')));
app.use(flash());
//헬멧 보안모듈 설정
app.use(helmet.hsts({
    maxAge : 10886400000,
    includeSubDomains : true
}))
//헬멧 보안모듈의 취약점인데 예를 들어, 비밀번호가 4자리면 앞 헬멧 모듈에 의해 앞에 2자리를 보여주기 떄문에 
app.disable('x-powered-by');
//======================DB에서 찾은 사용자의 정보를 세션에 저장하는 과정=========================
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(ID,done){
    userModel.findOne({ID : ID}, function(err, user){
        done(err, user);
    });
});
//==========================local passport설정=================================================
passport.use('local-login', new LocalStrategy({
    usernameField : 'ID',
    passwordField : 'PW',
    passReqToCallback : true},  (req,ID,PW,done)=>{
        userModel.findOne({'ID' : ID}, (err, user) =>{
            console.log('this is user : ', user);
            if(err) return done(err);
                
            if(!user){//이 경우 회원이 아니므로
                console.log('userID not found');
                console.log(user);
                return done(null, false);//false 값을 주어 로그인이 되지 않습니다.
            }
            if(!passport.authenticate(PW)){//회원은 맞는데 암호를 맞게 입력 했는지 확인하는 것
                console.log('!user.authenticate activated = PW is incorrect');
                return done(null, false);//암호가 틀리면 역시 false값을 주어 로그인이 되지 않는다.
            }
            else{
                console.log('passport.authenticate passed!')
                console.log('this is user in app.js',user);
                sessionStorage.setItem("sns",user.sns);
                sessionStorage.setItem("CID",user.ID);
                sessionStorage.setItem("email",user.ID);
                return done(null, user);//조건에 부합하여 로그인 정보를 user라는 이름으로 리턴한다.
            }
        })
}));
//=======================================네이버 passport설정===================================================


passport.use('naver', new NaverStrategy({
    clientID : 'LcjFtyxQo_IDm2x_THBO',
    clientSecret : 'TLmU0KZOkh',
    callbackURL : 'https://myappv202.herokuapp.com/naver_oauth'
}, (accessToken, refreshToken, profile, done)=>{
    console.log(profile);//가지고온 네이버 회원 정보 display

    const fullname = profile.displayName;
    const FN = fullname.substring(0,1);//성만 따오기
    const LN = fullname.substring(1,3);//이름만 따오기
    //user.js에 필요한 최소한의 정보를 sessionStorage에 저장
    sessionStorage.setItem("sns",profile.provider);
    sessionStorage.setItem("CID",profile.id);
    sessionStorage.setItem("email",profile._json.email);
    
    userModel.findOne({sns : profile.provider,CID : profile.id},(err,user)=>{
        if(err){return done(err);}
        if(!user){//해당 연동 계정이 없으면 내 웹사이트 DB에 없으면 새로 계정을 연동 계정을 이용하여 만든다.
            
            console.log('cannot find user so create new account');
            console.log(user);
            userModel.create({
                sns : profile.provider,
                Firstname : FN,
                Lastname : LN,
                CID : profile.id,
                ID : profile._json.email,
                PW : '',
                Address : {Street : '',City : '',State : '', Country : ''},
                img : profile._json.profile_image,
                token : accessToken}, function(err, user){
                    if(err) {
                        console.log('error detected!');
                        return done(err);
                    }
                    else{
                        //여기 session Storage에 오브젝트 아이디를 저장후 프로필을 찾는데 사용한다.
                        return done(null, user);
                    }
                }
            )
        }
        else{//해당 연동 계정이 내 웹사이트에 있으면 접속날짜를 갱신(이기능은 미구현이지만 써놓긴 하겠다.)하고 접속.
            console.log('this naver account was accessed in this website just go through login');
            console.log('this is naver userInfo : ',user);
            userModel.findById(user._id,(err,user)=>{
                if(err){
                    return done(err);
                }
                else{
                    console.log('this is user in app.js : ', user);
                     done(null, user);
                }
            })
        }
    })
}))
//==============================구글 passport 설정=======================================
passport.use('google', new GoogleStrategy({
    clientID : '917240113678-iclsglbj3rhqa26o3ln8hi87jr6jj0oi.apps.googleusercontent.com',
    clientSecret : 'CIPIq9EldT669j40L7ChRxqN',
    callbackURL : 'https://myappv202.herokuapp.com/google_oauth'
},  (accessToken, refreshToken, profile, done)=>{
    console.log(profile);
    sessionStorage.setItem("sns",profile.provider);
    sessionStorage.setItem("CID",profile.id);
    sessionStorage.setItem("email",profile._json.email);
    userModel.findOne({sns : profile.provider,CID : profile.id},(err,user)=>{
        if(err){return done(err);}
        if(!user){//해당 연동 계정이 없으면 내 웹사이트 DB에 없으면 새로 계정을 연동 계정을 이용하여 만든다.
            console.log('cannot find user so create new account');
            userModel.create({
                sns : profile.provider,
                Firstname : profile._json.family_name,
                Lastname : profile._json.given_name,
                CID : profile.id,
                ID : profile._json.email,
                PW : '',
                Address : {Street : '',City : '',State : '', Country : ''},
                img : profile._json.picture,
                token : accessToken}, function(err, user){
                    if(err) {
                        console.log('error detected!');
                        return done(err);
                    }
                    else{
                        //여기다 필요한 세션 정보(오브젝트 아이디)를 셋팅
                        return done(null, user)
                    }
                }
            )
        }
        else{//해당 연동 계정이 내 웹사이트에 있으면 접속날짜를 갱신(이기능은 미구현이지만 써놓긴 하겠다.)하고 접속.
            console.log('this naver account was accessed in this website just go through login');
            console.log('this is naver userInfo : ',user);
            userModel.findById(user._id,(err,user)=>{
                if(err){
                    return done(err);
                }
                else{
                    console.log('this is user in app.js : ', user);
                     done(null, user);
                }
            })
        }
    })
}));
//=======================================페이스북 passport설정==============================================
passport.use('facebook', new FacebookStrategy({
    clientID : '364089517625336',
    clientSecret : '1b993ff60379a741daf9b6e04013721d',
    callbackURL : 'https://myappv202.herokuapp.com/facebook_oauth'
},  (accessToken, refreshToken, profile, done)=>{
    console.log('this is profile',profile);
    sessionStorage.setItem("sns",profile.provider);
    sessionStorage.setItem("CID",profile.id);
    sessionStorage.setItem("email",profile.id);
    userModel.findOne({sns : profile.provider,CID : profile.id},(err,user)=>{
        if(err){return done(err);}
        if(!user){//해당 연동 계정이 없으면 내 웹사이트 DB에 없으면 새로 계정을 연동 계정을 이용하여 만든다.
            console.log('cannot find user so create new account');
            userModel.create({
                sns : profile.provider,
                Firstname : profile.familyName,
                Lastname : profile._json.givenName,
                CID : profile.id,
                ID : profile._json.id,
                PW : '',
                Address : {Street : '',City : '',State : '', Country : ''},
                img : 'https://graph.facebook.com/'+profile.id+'/picture?',
                token : accessToken}, function(err, user){
                    if(err) {
                        console.log('error detected!');
                        return done(err);
                    }
                    else{
                        //여기다 필요한 세션 정보(오브젝트 아이디)를 셋팅
                        return done(null, user)
                    }
                }
            )

        }
        else{//해당 연동 계정이 내 웹사이트에 있으면 접속날짜를 갱신(이기능은 미구현이지만 써놓긴 하겠다.)하고 접속.
            console.log('this naver account was accessed in this website just go through login');
            console.log('this is naver userInfo : ',user);
            userModel.findById(user._id,(err,user)=>{
                if(err){
                    return done(err);
                }
                else{
                    console.log('this is user in app.js : ', user);
                     done(null, user);
                }
            })
        }
    })
}));
//라우터 경로들 
app.use('/',userRoute);
app.use('*', (req, res ) => {
    return res.render('404.ejs')
})

//서버 생성
http.createServer(app).listen(process.env.PORT||app.get('port'),function(){
    console.log('at least you upload in right ')
    console.log('Express server is activated Port : ',app.get('port'))
})
//서버 생성(기존의 로컬을 이용한 연결 방법)
// http.createServer(app).listen(app.get('port'),function(){
//     console.log('at least you upload in right ')
//     console.log('Express server is activated Port : ',app.get('port'))
// })
//데이터베이스 닫기
console.log("closing database");
database.on('close',function(){
    console.log("database close()")
    database.close();
})
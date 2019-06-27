//app.js
//loaded package
//라우팅 및 서버생성에 필요한 패키지
var http = require('http');
var path = require('path');
var static = require('serve-static');
var express = require('express');
var bodyPaser = require('body-parser');
const userRoute = require('./route/user');



//mongoose 구동을 위한 패키지
const mongoose = require('mongoose');
const databaseurl = 'mongodb://localhost:27017/Thw2modimodi';
console.log('connecting to the database!');
mongoose.Promise = global.Promise;
mongoose.connect(databaseurl);
const database = mongoose.connection;
database.on('error',console.error.bind(console,'mongoDB connection error')); 
console.log('connected to the database.');

//라우팅 및 서버생성에 필요한 패키지
var app = express();

//set up
app.set('port',process.env.PORT || 8080);
app.set('views',__dirname+'/views');
app.set('view engine','ejs');

app.use(bodyPaser.urlencoded({extended : true}));
app.use(bodyPaser.json());
app.use(static(path.join(__dirname,'/')));


//라우터 경로들 

app.use('/',userRoute);
app.use('*', (req, res ) => {
    return res.render('404.ejs')
})

//서버 생성
http.createServer(app).listen(app.get('port'),function(){
    console.log('Express server is activated Port : '+app.get('port'))
})

//데이터베이스 닫기
console.log("closing database");
database.on('close',function(){
    console.log("database close()")
    database.close();
})
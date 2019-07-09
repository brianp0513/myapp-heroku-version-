const express = require('express');
const router = express.Router();
const userModel = require('../model/userModel');
const passport = require('passport');
const async = require('async');
const cookieParser = require('cookie-parser');
const sessionStorage = require('node-sessionstorage');


//-----------------------------------------메인페이지(로그인화면)------------------------------------------------
router.get('/',function(req,res){
    return res.render('../views/alterfrontpage.ejs');
})
//----------------------------------가입기능-------------------------------------
//로그인화면의 가입하기 버튼을 누를 시
router.get('/login/registeration', (req,res) =>{
    return res.render('../views/sign_up.ejs',{'event' : ''});
})
//가입정보를 데이터베이스에 저장
router.post('/login/registered',(req,res) =>{
    const profile = new userModel;
         profile.img = '/'+req.body.picture;
         profile.Firstname = req.body.firstName;
         profile.Lastname = req.body.LastName;
         profile.CID = req.body.ID;
         profile.ID = req.body.ID;
         profile.PW = req.body.PassWord;
         profile.Address.Street = req.body.Street;
         profile.Address.City = req.body.City;
         profile.Address.State = req.body.State;
         profile.Address.Country = req.body.Country;
        
       
         userModel.findOne({"ID" : req.body.ID})
                          .then(result =>{
                             if(!result){//가입할 아이디의 중복정보가 없으면
                                profile.save(function(err,doc){
                                    if(err) return res.render('../views/fail.ejs',{error : err})
                                    else{
                                        return res.render('../views/alterfrontpage.ejs')         
                                    }
                                 })
                             }
                             else{//가입할 아이디의 중복정보가 있으면
                                const duplicate = "duplicate();";
                                console.log('ID duplication');
                                 res.render('../views/sign_up.ejs',{'event' : duplicate});
                             }
                          })
         

})
//---------------------------------로그인이후------------------------------------
//가입된 유저인지 아닌지 가입이 됬으면 프로필 창으로 보내고 아니면 alert로 incorrect logininformation을 띄워준다.
    router.post('/login/progress',(req,res,next) =>{
        
        userModel.findOne({"ID" : req.body.ID}, (err,doc) =>{
            if(err) return console.log(err);
            if(!doc){
                console.log('Incorrect ID or PW');
                 return res.render('../views/alterfrontpage.ejs');
            }
            else{
                console.log(doc.PW);
                doc.comparePassword(req.body.PW, doc.PW, function(err, isMatch){
                    if (err){
                        return console.log(err);
                    }
                    if(!isMatch){
                        console.log('req.bodt.PW : ', req.body.PW);
                        console.log('doc.PW      : ', doc.PW);
                        return console.log('Invalid password');
                    }
                    else{
                        //인풋받은 ID와 패스워드를 찾아 오브젝트 아이디를 session storage에 저장하여 이걸 프로필 창에 띄우는데 사용한다.
                        console.log('you pass comparepassword function');
                        next();
                    }
                })
            }
        })
    },passport.authenticate('local-login',{
        successRedirect : '/showprofile',
        failureRedirect : '/',
        failureFlash : true
    })
    );
    //네이버 계정으로 로그인 하기
    function isLoggedIn(req,res,next){
        if(!req.authenticate()){
            return next();
        }else{
            red.render('../views/alterfrontpage.ejs');
        }
    }
    //네이버 로그인 
    router.get('/auth/naver',isLoggedIn, passport.authenticate('naver',{
        successRedirect : '/showprofile',
        failureRedirect : '/'
    }))
    //네이버 로그인 콜백 URL
    router.get('/naver_oauth',passport.authenticate('naver',{
        successRedirect : '/showprofile',
        failureRedirect : '/',
        failureFlash : true
    }))
    //구글 로그인
    router.get('/auth/google',isLoggedIn, passport.authenticate('google',{    
    }));
    //구글 로그인 콜백 URL
     router.get('/google_oauth',passport.authenticate('google',{
        scope : [//'https://www.googleapis.com/auth/plus.login',//기본 제공된 코드였는데 몇가지 정보(이메일)가 누락 되어 있었다.
                 'https://www.googleapis.com/auth/userinfo.profile',//사용자 프로필 제공
                 'https://www.googleapis.com/auth/userinfo.email'//사용자 이메일 제공                
                ],
                successRedirect : '/showprofile',
                failureRedirect : '/'  
    }))
    //페이스북 로그인
    router.get('/auth/facebook',isLoggedIn, passport.authenticate('facebook',{    
    }));
    //페이스북 로그인 콜백 URL
    router.get('/facebook_oauth',passport.authenticate('facebook',{
        scope : ['public_profile','email'],
        successRedirect : '/showprofile',
        failureRedirect : '/',
        failureFlash : true
    }))
    //모든 SNSpassport는 이 라우터 경로를 통과한다.
    router.get('/showprofile',(req,res)=>{
        //console.log('this is userinfo : ',req.session.user.sns);
        //return res.render('../views/profile.ejs',{'userInfo' : })
        userModel.findOne({"sns" : sessionStorage.getItem('sns'),"CID" : sessionStorage.getItem('CID'),"ID" : sessionStorage.getItem('email')}, (err,doc) =>{
            console.log('show login user : ',doc);
            return res.render('../views/profile.ejs',{'userInfo' : doc})
        })
    })
//-----------------------------프로필창-----------------------------------------
//logout 버튼은 아무런 정보를 가지고 가지 않고 다시 login page로 넘어간다. 나가기 버튼은 index ejs로 이동하도록 한다. 

//나가기 버튼으로 index ejs(게시판 창)로 이동하도록 한다.
router.post('/main', (req,res) =>{
    console.log('this is ID', req.body.ID);
    
    const datas = userModel;
    
    console.log('This is usermodel : ',datas);
    datas.find({_id : req.body.ID})
                    .then( result =>{
                        if(!result){
                            return res.render('../views/fail.ejs',{error : err})
                        }
                        else{
                            return res.render('../views/index.ejs',{'userInfo' : result , 'custLists' : datas})
                            
                        }
                    })
    
}) 
//edit 버튼
router.post('/login/edit', (req,res)=>{
    console.log('this is /login/edit');//가지고온 히든 정보를 써라
    userModel.findOne({"_id" : req.body.ID, "sns" : req.body.sns}).then( result =>{
        if(!result){
            return console.log('ID cannot find');
        }
        else{
            return res.render('../views/profileEdit.ejs',{'userInfo' : result})
        }
    })
})
//프로필 수정창에서 입력받아온 정보를 ID로 찾아내서 수정한다.(client쪽에선 modify 버튼을 누른 상태)
//수정할 데이터의 기존 정보를 삭제하고 수정된 정보를 새로 삽입 하는 방법을 시도 해봐라. 
//=================================프로필 수정창====================================================================================================================
router.post('/login/modicomplete', (req,res) =>{
    console.log('this is /login/edited router!')
    const profile = new userModel;//수정된 정보가 들어간 모델이다. 하지만 비밀번호는 bcrypt 되어 있지 안다. Bcrypt는 정보를 저장시에만 적용된다고 userModel.js에 명시 해놨다.
                profile.img = req.body.imgInput;
                profile.Firstname = req.body.Firstname;
                profile.Lastname = req.body.Lastname;
                profile.ID = req.body.ID;
                profile.PW = req.body.PW;
                profile.Address.Street = req.body.Street;
                profile.Address.City = req.body.City;
                profile.Address.State = req.body.State;
                profile.Address.Country = req.body.Country;
                profile.sns = req.body.sns;
                profile._id = req.body.objID;

                
                if(profile.sns !='local'){//연동계정
                    console.log('this is PW. length : ', profile.PW.length);
                    if(req.body.PW != 0){//패스워드를 바꿀려는 사람
                        return console.log(profile.sns+" User cannot change the password");
                        
                    }
                    console.log('you pass PW condition');
                    if(profile.img.length !=0){//프로필이미지를 바꿀려는 사람
                        return console.log(profile.sns+" User cannot change the image");
                        
                    }
                    else{//연동계정이 아무문제없이 프로필을 수정하려할 때
                        console.log('this is length of profile img : ',profile.img.length);
                        profile.img = req.body.picture;//공란으로 두면 말 그대로 아무것도 적용 안된 것도 되기때문에 전 이미지 링크로 돌린다.
                        profile.PW = req.body.originalPW;
                        
                        modifyprocess(profile);
                        console.log('successfully changed.');
                    }
                }
                else{//비연동 계정
                console.log('you pass local account statement');
                    if(profile.PW.length == 0 || profile.img.length ==0){//비밀번호와 프로필이미지가 공란이면
                        console.log('this is session storage : ',sessionStorage.getItem("localPW"));
                        console.log('this is oringal password : ',req.body.originalPW);
                        if(profile.PW.length==0){
                            profile.PW = req.body.originalPW;
                        }
                        else{
                            profile.img = req.body.picture;
                        }
                        profile.CID = req.body.ID;
                        modifyprocess(profile);
                    }
                    else{
                        console.log('local member changed.');
                        modifyprocess(profile);
                            }
                }
                function modifyprocess(profile){//프로필을 수정하는 기능
                    
                    userModel.findOneAndDelete({"_id" : profile._id},(err,doc)=>{
                        if(err){
                            return res.render('../views/fail.ejs',{error : err})
                        }
                        else{
                            console.log('delete old information!');
                            console.log('this is delete result : ',doc);
                            addnewinfo(profile);
                        }
                    })
                }
                function addnewinfo(profile){
                    profile.save((err,doc)=>{
                        if(err){
                            return res.render('../views/fail.ejs',{error : err})
                        }
                        else{
                            console.log('add new information complete!');
                            return res.render('../views/profile.ejs',{'userInfo' : profile})
                        }
                    })
                }
                                        })
//-----------------------------------게시글 삽입 기능-----------------------------
router.post('/main/post', (req,res) =>{
    return res.render('../views/postpage.ejs',{'Lastname' : req.body.Lastname});
})
//-----------------------------------관리자가 유저를 임의로 추가하는 기능------------------------------------
router.post('/api/task/insert', (req,res) =>{
    return res.render('../views/insertconsole.ejs');
})

router.post('/api/task', function(req,res){
    console.log(req.body.picture);
    //console.log("this is /api/task");
     const profile = new userModel;
        //  profile.img.data = fs.readFileSync(req.body.picture);
        //  profile.img.contentType = 'image/jpg';
         profile.img.url = req.body.picture;
         profile.Firstname = req.body.firstName;
         profile.Lastname = req.body.LastName;
         profile.CID = req.body.ID;
         profile.ID = req.body.ID;
         profile.PW = req.body.PassWord;
         profile.Address.Street = req.body.Street;
         profile.Address.City = req.body.City;
         profile.Address.State = req.body.State;
         profile.Address.Country = req.body.Country;

        
        profile.save(function(err, doc){
            if(err) res.render('../views/fail.ejs',{error : err})
            else{
                console.log('picture saved!');
                userModel.findById(profile,function(err,doc){
                    if(err) {res.render('../views/fail.ejs',{error:err})}
                    else{

                        console.log('this is doc',doc);
                        //입력이 완료된 프로필을 화면상에 띄워준다.
                        res.render('../views/profile.ejs',{'custList' : doc})

                        
                    }
                })
            }
        })
})




module.exports = router;
    

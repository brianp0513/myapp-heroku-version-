const express = require('express');
const router = express.Router();
const userModel = require('../model/userModel');


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
         profile.img.url = req.body.picture;
         profile.Firstname = req.body.firstName;
         profile.Lastname = req.body.LastName;
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
    router.post('/login/progress',(req,res) =>{
        
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
                        return console.log('Invalid password');
                    }
                    else{
                        return res.render('../views/profile.ejs',{'userInfo' : doc})
                    }
                })
            }
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
                            console.log('this is result',result);
                            
                        }
                    })
    
}) 
//edit 버튼
router.post('/login/edit', (req,res)=>{
    const logindata = req.body.logindata;
    console.log('this is /login/edit');
    console.log(req.body.logindata);
    userModel.findOne({"ID" : logindata}).then( result =>{
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
router.post('/login/modicomplete', (req,res) =>{
    console.log('this is /login/edited router!')
    const profile = new userModel;//수정된 정보가 들어간 모델이다. 하지만 비밀번호는 bcrypt 되어 있지 안다. Bcrypt는 정보를 저장시에만 적용된다고 userModel.js에 명시 해놨다.
                profile.img.url = req.body.imgInput;
                profile.Firstname = req.body.Firstname;
                profile.Lastname = req.body.Lastname;
                profile.ID = req.body.ID;
                profile.PW = req.body.PW;
                profile.Address.Street = req.body.Street;
                profile.Address.City = req.body.City;
                profile.Address.State = req.body.State;
                profile.Address.Country = req.body.Country;
   userModel.findOne({"ID" : req.body.ID})
                                          .then(result =>{
                                              if(!result){
                                                 console.log('cannot find userinformation');
                                              }
                                              else{//findOne의 else이다.
                                                console.log('this is profile',profile);//new information but not bcrypt password
                                                console.log('this is result',result);//original information
                                                  userModel.deleteOne({"ID" : req.body.ID}, function(err){
                                                      if(err) return console.log('delete one is error');
                                                      else{//deleteOne의 else이다.
                                                          profile.save(function(err,doc){
                                                              if(err) return res.render('../views/fail.ejs',{error : err})
                                                              else{//save의 else이다.
                                                                console.log('update complete');
                                                                console.log('this is doc in save : ',doc);
                                                                res.render('../views/profile.ejs',{'userInfo' : doc});
                                                              }
                                                          })
                                                      }
                                                  })
                                              }
                                          })
                                        })
//-----------------------------------게시글 삽입 기능-----------------------------
router.post('/main/post', (req,res) =>{
    return res.render('../views/postpage.ejs',{'Lastname' : req.body.Lastname});
})
//-----------------------------------삽입기능------------------------------------
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
//---------------------------------------수정기능----------------------------------
//해당 정보의 존재 유무를 확인후 콘솔창인지 에러창인지를 띄워준다.
router.post('/api/task/modifying/',(req,res) =>{
    console.log("this is modifying router!");
    userId = req.query.userId;
    console.log('this is userId : ',req.query.userId);
    userModel.findById(userId)
                              .then(result =>{
                        if(!result){
                                      console.log("userId not found");
                                      alert("userId not found");
                                      datas.find()
                                      .then( custList =>{
                                          if(!custList){
                                              return res.render('../views/fail.ejs',{error : err})
                                          }
                                          else{
                                              console.log('this is userLists :'+ custList);
                                              return res.render('../views/index.ejs',{'custList' : custList}) 
                                          }
                                      }) 
                                    }
                        else{
                                console.log("userID found!");
                                res.render('../views/modifyconsole.ejs',{'modiinfo' : result})
                            }
                              })

})
//업데이트할 정보를 업데이트 시키는 부분
router.post('/api/task/modified',(req,res) =>{
         const Newdata = {'Firstname' : req.body.Firstname,
                          'Lastname'  : req.body.Lastname,
                          'ID'        : req.body.ID,
                          'PW'        : req.body.PW,
                           Address :{  'Street'    : req.body.Street,
                                       'City'      : req.body.City,
                                       'State'     : req.body.State,
                                       'Country'   : req.body.Country},
                          'img' : {url : req.body.picture}
                        }
            userModel.findByIdAndUpdate({_id : req.body._id},Newdata,{upsert : true},(err,doc)=>{
                if(err){
                    res.render('../views/fail.ejs',{error : err})
                        }
                else{
                    console.log('update complete!');
                    const datas = userModel;
                    datas.find()
                    .then( userLists =>{
                        if(!userLists){
                            //업데이트중 문제가 생기면 fail.ejs로 보낸다.
                            return res.render('../views/fail.ejs',{error : err})
                        }
                        else{
                            //업데이트 완료시 index.ejs로 보낸다.
                            console.log('this is userLists :'+ userLists);
                            return res.render('../views/index.ejs',{'custList' : userLists}) 
                        }
                    })   
                }        
            })
})
//---------------------------------------삭제기능----------------------------------
router.post('/api/task/delete/',(req,res) =>{
    userId = req.query.userId;
        userModel.findByIdAndDelete({_id : userId},(err,doc) =>{
            if(err){
                res.render('../views/fail.ejs',{error : err});
            }
            else{
                console.log("delete complete");
                const datas = userModel;

                datas.find()
                            .then( custList =>{
                                if(!custList){
                                    return res.render('../views/fail.ejs',{error : err})
                                }
                                else{
                                    console.log('this is userLists :'+ custList);
                                    return res.render('../views/index.ejs',{'custList' : custList}) 
                                }
                            })  
                
            }
        })
})




module.exports = router;
    

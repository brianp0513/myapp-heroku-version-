const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');//비크립트 사용 선언

//스키마 생성
const SampleSchema = mongoose.Schema({
        sns : {type : String, default : 'local'},
        Firstname : {type : String, default : 'undefined'},
        Lastname : {type : String, default : 'undefined'},
        CID : {type : String},
        ID : String,
        PW : String,
        Address : {Street : String, City : String, State : String, Country : String},
        // img   : { data : Buffer, contentType : String ,url : String}
        img : String
});
//save 되기전(pre)에 모델에 대해서 할일을 schema에 저장하는 단계
SampleSchema.pre('save',function(next){
        const user = this;
        this.hashPassword(user.PW, function(err,hash){
                if(err){
                        return next(err);
                }
                else{
                        user.PW = hash;
                        next();
                }
        });
});
SampleSchema.methods.comparePassword = function(candidatePassword,hashedpassword, callback){
        bcrypt.compare(candidatePassword, hashedpassword,function(err,isMatch){
                 if(err){
                         return callback(err);
                 }
                 return callback(null,isMatch);
        });
}
SampleSchema.methods.hashPassword = function(candidatePassword, callback){
        bcrypt.genSalt(11, function(err,salt){
                if(err) return callback(err);
                else{
                        console.log(salt);
                        bcrypt.hash(candidatePassword, salt, function(err,hash){
                                if(err){
                                        return callback(err);
                                }
                                else{
                                       return callback(null,hash);
                                }
                        })
                }
        })
}
//스키마를 모델로 정의(instance 화 시킨다고 한다.)
const sampletask = mongoose.model("custLists",SampleSchema);

module.exports = sampletask;
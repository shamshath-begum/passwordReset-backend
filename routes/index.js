var express = require('express');
var router = express.Router();
const mongoose=require('mongoose')
const {dbUrl}=require('../config/dbConfig')
const {UserModel}=require('../schema/userSchema.js')
const {hashPassword,hashCompare,createToken,decodeToken,validate,roleAdmin,roleSalesRep}=require('../config/auth')
const sgMail = require('@sendgrid/mail')
const secretKey="lkhhfalshflk"
const jwt=require('jsonwebtoken');


mongoose.set('strictQuery',true)
mongoose.connect(dbUrl)

router.post('/signup',async(req,res)=>{
  try {
    let user=await UserModel.findOne({email:req.body.email})
    if(!user){
     req.body.password= await hashPassword(req.body.password)
      let doc=new UserModel(req.body)
      await doc.save()
      res.status(201).send({
        message:"User Created successfully"
      })
    } 
    else{
      res.status(400).send({message:"User already exists"})
    }
    } catch (error) {
      console.log(error)
      res.status(500).send({message:"Internal Server Error",
    error
    })
    }
    
    
})

router.post('/login',async(req,res)=>{
  try {
    let user=await UserModel.findOne({email:req.body.email})
    console.log(user)
    if(user)
    {
      if(await hashCompare(req.body.password,user.password))
      {
         let token=createToken({firstName:user.firstName,lastName:user.lastName,email:user.email,role:user.role})
         console.log(token)

res.status(200).send({message:"Login Successful",token,role:user.role})
        // res.status(200).send({firstName:user.firstName,lastName:user.lastName,email:user.email,role:user.role,tokens:token})
        // user.save()
      }
      else{
        res.status(400).send({message:"Invalid credentials"})
          }
         } else{
          res.send({message:"Email doesnot exists"})
         }
    } catch (error) {
      console.log(error)
      res.status(500).send({message:"Internal Server Error",
    error
    })
    }
    })

router.post('/sendpasswordlink',async(req,res)=>{
  console.log(req.body) 
  
  let {email} = req.body;
  if(!email){
    res.status(401).send({message:"Enter Your Email"})
  }
  try {
    let user=await UserModel.findOne({email:req.body.email})
    
    let token=createToken({_id:user._id})
       let setuserToken=await UserModel.findByIdAndUpdate({_id:user._id},{token:token},{new:true}) 
       console.log(setuserToken.token)
      if(setuserToken){
        sgMail.setApiKey('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')
const msg = {
  to: `${email}`, // Change to your recipient
  from: 'sham29.b@gmail.com', // Change to your verified sender
  subject: "Sending Email For Password Reset ",
  text: `This Link valid for 30 minutes http://localhost:3000/forgotpassword/${user.id}/${setuserToken.token} `,
  }
sgMail
  .send(msg)
  .then(() => {
    res.status(204).send({message:"hello"})
    console.log('Email sent')
  })
  .catch((error) => {
    console.error(error)
  })
 }
} catch (error) {
    console.log(error)
    
  }
})

router.get('/forgotpassword/:id/:token',async(req,res)=>{
  let{id,token}=req.params;
  
   try {
    let verifyUserId=await UserModel.findOne({_id:id,token:token})
    
    let verifyUserToken=jwt.verify(token,secretKey)
    console.log(verifyUserToken)

   if(verifyUserId && verifyUserToken){
    console.log(verifyUserId)
     res.status(201).send(verifyUserId)

   }else{
     res.status(401).send({message:"not a valid user"})
   }
   } catch (error) {
      res.status(401).send({message:"Invalid User"})
    console.log("error",error)
   }
})

 router.post('/:id/:token',async(req,res)=>{
  let{id,token}=req.params;
  let{password}=req.body;
  console.log(id,token)
  console.log(password)
  try {
     let verifyUserId=await UserModel.findOne({_id:id,token:token})
    
     let verifyUserToken=jwt.verify(token,secretKey)
     console.log(verifyUserToken)

    if(verifyUserId && verifyUserToken){
      let newPassword=await hashPassword(password)
      console.log(newPassword)
      let setPasswordInDB=await UserModel.findByIdAndUpdate({_id:id},{password:newPassword})
      setPasswordInDB.save();

     res.status(201).send(setPasswordInDB)
   }else{
     res.status(401).send({message:"not a valid user"})
 }
    } catch (error) {
      res.status(401).send({message:"Invalid User"})
    console.log("error",error)
    }
 })

module.exports = router;

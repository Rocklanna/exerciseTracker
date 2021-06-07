const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyparser = require('body-parser');
const mongoose =require('mongoose');
app.use(bodyparser.urlencoded({extended:false}));

mongoose.connect(process.env.MONGO_URL,{useNewUrlParser: true, useUnifiedTopology: true});

const newusers= new mongoose.Schema({
  username:String,
  },
  { toObject: { versionKey: false }
});

const userdetails= new mongoose.Schema({
  userid:{type:String,required:true},
  description:{type:String,required:true},
  duration:{type:Number,required:true},
  date:Date
  },
  { toObject: { versionKey: false }
});

var exerciser = mongoose.model("exerciser",newusers); 
var userExercises = mongoose.model("userExercises",userdetails); 

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/exercise/new-user",function(req,res){
  var user = req.body.username;
  
 
  var gottenuser = new exerciser({username:user});
  
  exerciser.find({username:user},function(err,founduser){// check if username already exists
    
    if(err){// if error
      console.log("Error occured, please try again");
    }
    if(founduser.length>0){ //if user already exists
        res.send("Username taken");
    }
    else{// if user doesnt exists
      
      gottenuser.save(function(err,saveduser){
        if(err){
          res.send("unable to save user");
        }
        res.json({username:saveduser["username"],_id:saveduser["_id"]});
      });
        
 
    }// end of else
  }) // end of checking if user exists
  
 
})// end of post

  app.get("/api/exercise/users",function(req,res){
    
   // res.send("list");
   exerciser.find({username:/\w+/g},function (err,list){
      if(err){
        res.send("Error occured, please try again");
      }
      res.send(list);
    })
  });


app.post("/api/exercise/add",function(req,res){
  var userid = req.body.userId;
  var description = req.body.description;
  var inputTime = parseInt(req.body.duration); // must be number
  var inputDate = req.body.date
  var duration = (inputTime && inputTime>0) ?  inputTime  :  res.send("Invalid duration entered");
  
  var date = (inputDate ==="" || inputDate=== undefined) ?
               new Date().toDateString()
             : new Date(inputDate).toDateString();
    
  
  //var addexercise = new userExercises({userid:userid,description:description,duration:duration,date:date});
   
   var addexercise = new userExercises({userid:userid,description:description,duration:duration,date:date});
  
   if(date ==="Invalid Date"){
      return res.send("Invalid date entered");
    }
    else{// outer else 2
     
      exerciser.find({_id:userid},function(err,foundID){
        if(err){
          console.log(err);
          return res.send("Error occured, please try again");
        }
        if(foundID.length>0){
          addexercise.save(function(err,savedExercise){
            if(err){
              console.log(err);
              return res.json("unable to save exercise");
            }
           res.json({_id:savedExercise["userid"], username:foundID[0]["username"],date:savedExercise["date"].toDateString(),duration:savedExercise["duration"],description:savedExercise["description"]}); 
            //res.json(savedExercise);
          });
        } 
        else{
          return res.send("Userid does not exist");
        }
      })
  } // outer else 1
  
});


app.get("/api/exercise/log",function(req,res){
  
  var regex = /^\d+/g;
  var userId = req.query.userId;
var startDate = new Date(req.query.from);
  var endDate =new Date(req.query.to);
  var limit = parseInt(req.query.limit);
  
  if (!userId){
   return res.send("Enter user id to search for")
   };
   

  
 if (! regex.test(req.query.limit) && req.query.hasOwnProperty("limit")){
   return res.send("Limit is not an Integer")
 }
  

 if(req.query.hasOwnProperty("from") && startDate.toDateString() ==="Invalid Date"){
  
      return res.send(endDate.toDateString());
    }

  
  if(req.query.hasOwnProperty("to") && endDate.toDateString()==="Invalid Date"){
  
      return res.send(endDate.toDateString());
    }

 // res.send("out of here");
  
   var query={userid:userId,
               date:{$gte:startDate,$lte:endDate}
              };
  
  (req.query.from)?query.date.$gte=startDate:delete query.date.$gte ;
  (req.query.to)?query.date.$lte=endDate:delete query.date.$lte ;
  
    if (!req.query.to && !req.query.from){
     delete query.date
   };
  

      

  
//res.send(query);
  


  userExercises.find(query,{description:1,duration:1,date:1,_id:0},function(err,foundExercises){ // find ... and return only specified fields
    
    if(err){
     console.log(err);
      return res.send("Error occured, Please try again");
    }
    var count = foundExercises.length;
    
    if(count>0){
      exerciser.find({_id:userId},function(err,foundUser){
        if(err){
          console.log(err);
         return  res.send("Error occured, Please try again right here");
        }
        
     /* if(startDate){
        foundExercises = foundExercises.filter(item=> item.date>startDate);
         //return res.send("stops here");
        }
      if(endDate){
          foundExercises = foundExercises.filter(item=> item.date<endDate);
        }*/
        
        foundExercises = foundExercises.map(item=>{return {description:item["description"],duration:item["duration"],date:new Date(item["date"]).toDateString()}});
        
        res.json({_id:foundUser[0]["_id"], username:foundUser[0]["username"], count:count, log:foundExercises});
        
      })// find username
    } // end if, if exercises are found
    else{
      res.send("This user has no exercise record");
    }// end of else
    

  
  
}).limit(limit)// mongoose find exercieses


  
})//  get function

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

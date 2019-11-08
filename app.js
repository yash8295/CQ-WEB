var express=require('express');
var app=express();
var port=8000;
var path=require('path');
var ejs = require('ejs');
var session = require('express-session');
var nodemailer=require('nodemailer');
var multer = require('multer');
var ObjectId = require('mongodb').ObjectID;
//const bcrypt = require('bcrypt');
//const saltRounds = 10;

app.set('views', path.join(__dirname,'public'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname,'public')));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(session({secret: "lInkwEb"}));

var mongoose=require('mongoose');
var mongoDB='mongodb://localhost/CQDB';
mongoose.connect(mongoDB);

mongoose.connection.on('error',(err)=>{
	console.log("DB Connection Error");
});

mongoose.connection.on('connected',(err)=>{
	console.log("DB connected Successfully");
});
var Schema=mongoose.Schema;

var userSchema = Schema({
	name: String,
	username: String,
	password: String,
	city: String,
	phoneno: String, 
	gender: String,
	dob: String,
	role: String,
	status:String,
	pic_id:String,
	date_created:Date,
	PI1:String,
	PI2:String,
	PI3:String,
	activity:String
});

var communitySchema = Schema({
	name: String,
	membershipRule: String,
	location: String,
	owner: {UID:String,user:String,name:String,picID:String},
	createDate: String,
	activity: String,
	description: String,
	picId: String,
	members:[{UID:String,user:String,name:String,picID:String}],
	request:[{UID:String,user:String,name:String,picID:String}],
	admin:[{UID:String,user:String,name:String,picID:String}],
    invited:[{UID:String,user:String,name:String,picID:String}]
});

var tagSchema=Schema({
	tagName:String,
	createdBy:String,
	createDate:String
});

var userdetails=mongoose.model('userDetails',userSchema,'userDetails');
var communitydetails=mongoose.model('communityDetails',communitySchema,'communityDetails');
var tagdetails=mongoose.model('tagDetails',tagSchema,'tagDetails');

//====================Functions=========================

function SendNodeMail(To,name,pass)
{
var transporter=nodemailer.createTransport({
	service:'gmail',
	secure:false,
	port:25,
	auth:{
		user:'togetherconnect0@gmail.com',
		pass:'connect123!'
	},
	tls:{
		rejectUnauthorized:false
	}
});

var mailOptions={
	from:'meetgreet12@gmail.com',
	to:To,
	subject:'Welcome to CQ',
	text:'Hi '+name+', You have been Successfully Registered to CQ\nPassword:'+pass
}
transporter.sendMail(mailOptions,function(err,info){
	if(err)
	{
		console.log(err);
		throw err;
	}
	else
		console.log('Email Sent'+info.resopnse);
});

}
function SendAdminMail(To,name,sub,tex)
{
var transporter=nodemailer.createTransport({
	service:'gmail',
	secure:false,
	port:25,
	auth:{
		user:'togetherconnect0@gmail.com',
		pass:'connect123!'
	},
	tls:{
		rejectUnauthorized:false
	}
});
if(tex=='\n')
{
	tex='Hello '+name+' this is a Reminder Mail';
}
if(sub=='')
{
	sub='Reminder Mail';
}
var mailOptions={
	from:'meetgreet12@gmail.com',
	to:To,
	subject:sub,
	text:tex
}
transporter.sendMail(mailOptions,function(err,info){
	if(err)
	{
		console.log(err);
		throw err;
	}
	else
		console.log('Email Sent'+info.resopnse);
});

}


function sanitizeFile(file, cb) {
    let fileExts = ['png', 'jpg', 'jpeg', 'gif'];
    let isAllowedExt = fileExts.includes(file.originalname.split('.')[1].toLowerCase());
    let isAllowedMimeType = file.mimetype.startsWith("image/");
    if(isAllowedExt && isAllowedMimeType){
        return cb(null ,true);
    }
    else{
        cb('Error: File type not allowed!');
    }
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/image')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now()+ file.fieldname+'.'+file.originalname.split('.')[1].toLowerCase())
    }
});
   
var upload = multer({ storage: storage ,
    limits: {
        fileSize: 1000000
    },
    fileFilter: function (req, file, cb) {
        sanitizeFile(file, cb);
    }
}).single('profilePic');

//=====================================================

app.get('/',function(req,res){
	req.session.isLogin=0;
	req.session.username="";
	req.session.role="";
	req.session.img_id="";
	req.session.name="";
		res.sendFile('/index.html');
});

app.get('/home',function(req,res){
	
	var data={name:req.session.name,pic_id:req.session.pic_id,role:req.session.role}
	res.send(data);
	
});


app.post('/login',function(req,res){
	//console.log(req.body.username,req.body.password);
	console.log(req.body);
	userdetails.find({username:req.body.username,password:req.body.password}).exec(function(err,updata){
		if(err)
		{
			//console.log(err);
			throw err;
		}
		else
		{
			console.log(updata.length);
			if(updata.length==0)
				res.send('NO');
			else
			{
				req.session.isLogin=1;
				req.session.username=updata[0].username;
				req.session.role=updata[0].role;
				req.session.pic_id=updata[0].pic_id;
				req.session.name=updata[0].name;
				req.session.status=updata[0].status;
				console.log(req.session);
				if(updata[0].status=='Pending')
				{
					res.send('/editInformation');
				}
				else
				{
					if(req.session.role=='Admin')
						res.send('/Admin_profile');
				}
			}
		}
	});
});

app.get('/editInformation',function(req,res){

	userdetails.find({username:req.session.username}).exec(function(err,data1)
		{
			if(err)
				throw err;
			res.render('EditInfo',{data:data1});
		});

});

app.get('/Admin_profile',function(req,res){
	if(req.session.role=='Uadmin')
			req.session.role='Admin';
	if(req.session.isLogin>=1)
	{
		if(req.session.role!='Admin')
			res.redirect('/');
		//console.log(req.session.username);
		userdetails.find({username:req.session.username}).exec(function(err,updata){
			if(err)
			{
				//console.log(err);
				throw err;
			}
			else
			{
				res.render('\Admin_details',{data:updata});
			}
		});
	}
	else
		res.redirect('/');
	
});

app.get('/adduser',function(req,res){
	if(req.session.isLogin>=1)
	{
		if(req.session.role!="Admin")
			res.redirect('/');
		res.render('\add_user');
	}
	else
		res.redirect('/');
});

app.post('/addUsers',function(req,res){
	
	
	var newUserDetails=new userdetails({
		name: req.body.name,
		username: req.body.username,
		password: req.body.password,
		city: req.body.city,
		phoneno: req.body.phoneno, 
		gender: req.body.gender,
		dob: req.body.dob,
		role: req.body.role,
		status: "Pending",
		activity: "Active",
		PI1: "",
		PI2: "",
		PI3: "",
		pic_id:'1566499870777profilePic.png',
		date_created:Date.now()
		});
	userdetails.find({
        username: req.body.username,
    }).exec(function(err,data){
		if(err)
		{
			console.log(err);
			throw err;
		}
		//console.log(data);
		if(data.length==0)
		{
			newUserDetails.save()
			.then(savedData => {
				console.log(savedData);
				res.send(data);
			})
			.catch(err => {
				console.log(err);
				res.status(400).send(error);
			});
			SendNodeMail(req.body.username,req.body.name,req.body.password);
		}
		else
		{
			res.send(data);
		}
    });
	
	
	//console.log(req.body);
});

app.get('/userlist',function(req,res){
	
	if(req.session.isLogin>=1)
	{
		if(req.session.role!='Admin')
			res.redirect('/');
		res.render('\adminuserlist');
	}
	else
		res.redirect('/');
	
});

app.post('/getuserdata',function(req,res){
	
var tCount,fCount;
	var size=parseInt(req.body.length);
	var start=parseInt(req.body.start);
	var serby=req.body.columns[parseInt(req.body.order[0].column)].name.toString();
	var ser=req.body.search.value;
	var sRole=req.body.role;
	var sStatus=req.body.status;
	userdetails.count({}).exec(function(err,totalCount)
	{
		if(err)
			res.send(err);
		tCount=totalCount;
	});
	var fin={username :new RegExp('^'+ser+'.*$', "i"),role : new RegExp('^'+sRole+'.*$', "i"),status : new RegExp('^'+sStatus+'.*$', "i")};
	userdetails.count(fin).exec(function(err,totalCount)
	{
		if(err)
			res.send(err);
		fCount=totalCount;
	});
	if(serby=='username')
	{	
		var obj={'username':req.body.order[0].dir};
	}
	else if(serby=='phoneno')
	{	
		var obj={'phoneno':req.body.order[0].dir};
	}
	else if(serby=='city')
	{	
		var obj={'city':req.body.order[0].dir};
	}
	else if(serby=='status')
	{	
		var obj={'status':req.body.order[0].dir};
	}
	else
	{	
		var obj={'role':req.body.order[0].dir};
	}
	userdetails.find(fin).skip(start).sort(obj).limit(size).exec(function(err,data){
		if(err)
		{
			res.send(err);
		}
		var totalPages=Math.ceil(fCount/size);
		res.send({pageLength:size,recordsTotal:tCount,recordsFiltered:fCount,data: data});
	});
	
});

app.get('/changePassword',function(req,res){
	
	console.log(1);
	if(req.session.isLogin>=1)
	{
		if(req.session.role=='Admin'||req.session.role=='Uadmin')
		{
			res.render('Change_Pass');
		}
		else
			res.redirect('/');
	}
	else
		res.redirect('/');
});

app.put('/changePass',function(req,res)
{
	var o=req.body.oldPassword;
	var n=req.body.newPassword;
	//console.log(req.body);
	userdetails.find({'username':req.session.username,'password':o}).exec(function(err,data)
		{
			if(err)
				throw err;
			if(data.length==0)
			{
				res.send("[]");
			}
			else
			{
				userdetails.update({'username':req.session.username,'password':o},{$set:{'password':n}}).exec(function(err,udata)
					{
						if(err)
							throw err;
						//req.session.isLogin=0;
						res.send(data);
					});
			}
		});
});

app.get('/profile',function(req,res){
	if(req.session.isLogin==1)
	{
		if(req.session.role=='Uadmin')
		{
			
			userdetails.find({username:req.session.username}).exec(function(err,updata){
			if(err)
			{
				//console.log(err);
				throw err;
			}
			else
			{
				res.render('\UadminProfile',{data:updata});
			}
		});
		}
		else if(req.session.role=='User')
		{
			res.send('User Page Coming Soon');
		}
		else
			res.redirect('/');
	}
	else
		res.redirect('/');
});

app.get('/editProfile',function(req,res){
	
	if(req.session.isLogin==1)
	{
		if(req.session.role=='Uadmin')
		{
			userdetails.find({username:req.session.username}).exec(function(err,udata){
				if(err)
					throw err;
				console.log(udata);
				res.render('\UadminEdit',{data:udata});
			});
			
		}
		else
			res.redirect('/');
	}
	else
		res.redirect('/');
	
});

app.post('/updateProfile',function(req,res){
	
	// console.log(req.body);
	upload(req,res,(err)=>{
		console.log(req.body);
        if (err){ 
            res.send({ 'msg': err});
        }else{
            if (req.file == undefined) {
               	userdetails.updateOne({username: req.body.username},
					{
						name: req.body.name,
						city: req.body.city,
						phoneno: req.body.phone, 
						gender: req.body.gender,
						dob: req.body.date,
						status: "Confirmed",
						PI1: req.body.PI1,
						PI2: req.body.PI2,
						PI3: req.body.PI3,
					}).exec((err,data)=>{
						if(err)
							res.send(err);
						if(req.session.role=='Uadmin')
							res.redirect('/Admin_profile');
						else if(req.session.role=='User')
							res.redirect('/profile');
					});
            }
            else
			{
				console.log(req.body);
				userdetails.updateOne({username: req.body.username},
				{
					name: req.body.name,
					city: req.body.city,
					phoneno: req.body.phone, 
					gender: req.body.gender,
					dob: req.body.date,
					status: "Confirmed",
					pic_id: req.file.filename,
					PI1: req.body.PI1,
					PI2: req.body.PI2,
					PI3: req.body.PI3,
				}).exec((err,data)=>{
					if(err)
						res.send(err);
					req.session.pic_id=req.file.filename;
					if(req.session.role=='Uadmin')
						res.redirect('/Admin_profile');
					else if(req.session.role=='User')
						res.redirect('/profile');
				});
            }
        }
    });

	
});

app.get('/communityList',function(req,res){
	
	if(req.session.isLogin>=1)
	{
		if(req.session.role=='Admin')
		{
			res.render('\adminCommList');
		}
		else
			req.redirect('/');
	}
	else
		res.redirect('/');
	
});

app.post('/communities',function(req,res){
	
	console.log(req.body);
	var tCount,fCount;
	var size=parseInt(req.body.length);
	var start=parseInt(req.body.start);
	var serby=req.body.columns[parseInt(req.body.order[0].column)].name.toString();
	var ser=req.body.search.value;
	var sStatus=req.body.status;
	communitydetails.count({}).exec(function(err,totalCount)
	{
		if(err)
			res.send(err);
		tCount=totalCount;
	});
	var fin={name :new RegExp('^'+ser+'.*$', "i"),membershipRule : new RegExp('^'+sStatus+'.*$', "i")};
	communitydetails.count(fin).exec(function(err,totalCount)
	{
		if(err)
			res.send(err);
		fCount=totalCount;
	});
	if(serby=='name')
	{	
		var obj={'name':req.body.order[0].dir};
	}
	else if(serby=='location')
	{	
		var obj={'location':req.body.order[0].dir};
	}
	else if(serby=='owner')
	{	
		var obj={'owner.name':req.body.order[0].dir};
	}
	else
	{	
		var obj={'createDate':req.body.order[0].dir};
	}
	communitydetails.find(fin).skip(start).sort(obj).limit(size).exec(function(err,data){
		if(err)
		{
			res.send(err);
		}
		var totalPages=Math.ceil(fCount/size);
		res.send({pageLength:size,recordsTotal:tCount,recordsFiltered:fCount,data: data});
	});
	
});

app.get('/CreateCommunity',function(req,res){
	
	if(req.session.isLogin==1)
	{
		if(req.session.role=='Uadmin')
		{			
			res.render('\UadminAddComm');	
		}
		else
			res.redirect('/');
	}
	else
		res.redirect('/');
	
});

app.post('/addComm',function(req,res){
	
	
	console.log(req.body);
	var date=new Date();
	var C_Date=date.getDate()+'/'+date.getMonth()+'/'+date.getFullYear();
	userdetails.find({
        username: req.session.username,
    }).exec(function(error,data){
    	if(error)
    		res.send(error);
		upload(req,res,(err)=>{
			console.log(req.body,req.file);
			//console.log(req.file);
			//console.log(data);
		    if (err){ 
		        res.send({ 'msg': err});
		    }else{
		    	var newCommunityDetails=new communitydetails({
					name: req.body.name,
					membershipRule: req.body.method,
					location: "Not Added",
					owner: {UID:data[0]._id,user:data[0].username,name:data[0].name,picID:data[0].pic_id},
					createDate: C_Date,
					activity: "Active",
					description: (req.body.description=='')?"New Community":req.body.description,
					picId: (req.file==undefined) ? "1566500091617profilePic.jpg" : req.file.filename,
					members:[],
					request:[],
					admin:[],
				    invited:[]
				});
		        newCommunityDetails.save()
				.then(savedData => {
					res.redirect('/communityPanel');
				})
				.catch(err => {
					res.send(err);
				});
		    }
		});
	});
	
});

app.get('/tag',function(req,res){
	
	if(req.session.isLogin>=1)
	{
		if(req.session.role=='Admin')
		{
			res.render('tag');
		}
		else
			res.redirect('/');
	}
	else
		res.redirect('/');
	
});

app.post('/addTag',function(req,res){
	
	//console.log(req.body);
	var newtagdetails=new tagdetails({
		tagName:req.body.tagName,
		createdBy:req.session.name,
		createDate:req.body.createDate
	});
	tagdetails.find({tagName:req.body.tagName}).exec(function(err,data){
		
		if(err)
			res.send(err);
		if(data.length==0)
		{
			newtagdetails.save().then(savedData=>{
				console.log(savedData);
				res.send(data);
			})
			.catch(err=>{
				console.log(err);
				res.status(400).send(error);
			});
			
		}
		else
			res.send(data);
		
	});
	
});

app.get(['/tagslist'],function(req,res){
	
	if(req.session.isLogin>=1)
	{
		if(req.session.role=='Admin')
		{
			tagdetails.find({}).exec(function(err,data)
				{
					if(err)
						throw(err);
					else
					{
						res.render('tagList',{tag:data});
					}
				})
		}
		else
			res.redirect('/');
	}
	else
		res.redirect('/');
	
});

app.get('/getUsers',function(req,res){
	
	userdetails.find({}).exec(function(err,data){
		if(err)
			res.send(err);
		else
			res.send(data);
	})
	
});

app.delete('/deleteTag',function(req,res){
	
	tagdetails.remove({tagName:req.body.tagName}).exec(function(err,data){
			if(err)
				throw(err);
			res.send(data);
	})
	
});

app.put('/updateUser',function(req,res){
	
	console.log(req.body);
	userdetails.find({username:req.body.username}).exec(function(err,udata){
		if(err)
			throw err;
		else if(udata[0].username==req.body.username||udata.length==0)
		{
			userdetails.updateOne({username:req.body.oldUser},{$set:{username:req.body.username,phoneno:req.body.phone,city:req.body.city,
			role:req.body.role,status:req.body.status}}).exec(function(err,data){
				if(err)
					throw err;
				res.send(data);
			});
		}
		else
			res.send('Already Exists');
	});	
});

app.put('/activation',function(req,res){
	
	if(req.body.username==req.session.username&&req.body.activity=='Inactive')
	{
		f=1;
		req.session.destroy();
		//res.redirect('/')
	}
	console.log(req.body);
	userdetails.updateOne({username:req.body.username},{$set:{activity:req.body.activity}}).exec(function(err,data){
		if(err)
			throw err;
		res.send(data);
	});
	
});

app.put('/updateCommunity',function(req,res){
	
	console.log(req.body);
	communitydetails.updateOne({_id:ObjectId(req.body.ID)},{$set:{name:req.body.newName,activity:req.body.activity}}).exec(function(err,data){
		
		if(err)
			throw err;
		res.send(data);
		
	});
});
app.post('/sendMail',function(req,res){
	
	console.log(req.body);
	SendAdminMail(req.body.id,req.session.name,req.body.subject,req.body.text);
	res.send('Mail Sent');
	
});
app.get('/communityPanel',function(req,res){
	if(req.session.role=='Admin')
		req.session.role='Uadmin';
	if(req.session.isLogin==1)
	{
		if(req.session.role=='Uadmin')
		{
			communitydetails.find({$or:[{'owner.user':req.session.username},{'admin.user':req.session.username}]}).exec((err,data1)=>{
		if(err)
			res.send(err);
		communitydetails.find({'members.user':req.session.username}).exec((err,data2)=>{
			if(err)
				res.send(err);
			communitydetails.find({'request.user':req.session.username}).exec((err,data3)=>{
				if(err)
					res.send(err);
				userdetails.find({username: req.session.username}).exec((err,updata)=>{
					if(err)
						res.send(err);
						res.render('UadminCommList',{community1 : data1,community2 : data2,community3 : data3});
				});
			});
		});
	});
		}
		else
			res.redirect('/');
	}
	else
		res.redirect('/');
	
});
app.get('/List',function(req,res){
	
	if(req.session.isLogin==1)
	{
		if(req.session.role=='Uadmin')
		{
			userdetails.find({
				username: req.session.username
			}).exec((err,updata)=>{
			if(err)
			{
				res.send(err);
			}
				res.render('uadminSearchList');
			});
		}
		else
			res.redirect('/');
	}
	else
		res.redirect('/');
	
});
app.post('/getComm',function(req,res){
	
	console.log(req.body);
	var fin={name :new RegExp('^'+req.body.search_value+'.*$', "i")};
	communitydetails.find({$and: [fin,{'owner.user':{$ne:req.session.username}},{'members.user':{$ne:req.session.username}},{'admin.user':{$ne:req.session.username}},{'request.user':{$ne:req.session.username}}]})
	.skip(req.body.skip).limit(req.body.limit).exec(function(err,data){
		if(err)
			res.send(err);
		console.log(data);
		res.send(data);
	});
});

app.put('/directJoin',function(req,res){
	
	console.log(req.body);
	userdetails.find({username:req.session.username}).exec(function(err,data){
		if(err)
			throw err;
		communitydetails.updateOne({_id:ObjectId(req.body.cname)},{$push: {members:{UID:data[0]._id,user:data[0].username,name:data[0].name},picID:data[0].pic_id}})
		.exec(function(err,data1){
			if(err)
				throw err;
			res.send(data1);
		})
	})
	
	
});

app.put('/askToJoin',function(req,res){
	
	userdetails.find({username:req.session.username}).exec(function(err,data){
		if(err)
			throw err;
		communitydetails.updateOne({_id:ObjectId(req.body.cname)},{$push:{request:{UID:data[0]._id,user:data[0].username,name:data[0].name,picID:data[0].pic_id}}})
		.exec(function(err,data1){
			if(err)
				throw err;
			res.send(data1);
		})
	})
	
});

app.get('/communityprofile/:cid',function(req,res){
	
	if(req.session.isLogin==1)
	{
		if(req.session.role=='Uadmin')
		{
			communitydetails.find({_id:ObjectId(req.params.cid)}).exec((err,data)=>{
		if(err)
		{
			res.send(err);
		}
		userdetails.find({
			username: req.session.username
		}).exec((err,updata)=>{
			var flag=0;
			if(err)
			{
				res.send(err);
			}
			if(data[0].members.some(el=>el.user==req.session.username))
			{
				
					res.render('uCommProfile',{role:'member',pId:updata[0].picId,name:updata[0].name,community : data});
				flag=1;
			}
			else if(data[0].request.some(el=>el.user==req.session.username))
			{
					res.render('uCommProfile',{role:'pending',pId:updata[0].picId,name:updata[0].name,community : data});
				flag=1;
			}
			else if(data[0].owner.user==req.session.username||data[0].admin.some(el=>el.user==req.session.username))
			{
					res.render('uCommProfile',{role:'owner',pId:updata[0].picId,name:updata[0].name,community : data});
				flag=1;
			}
			else
			{
					res.render('uCommProfile',{role:"",pId:updata[0].picId,name:updata[0].name,community : data});
			}
		});
	});
		}
		else
			res.redirect('/');
	}
	else
		res.redirect('/');
	
});


app.listen(port,()=>{console.log(`Listening on ${port}`)});
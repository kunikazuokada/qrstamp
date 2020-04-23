const url = require('url');
const package = require('./package.json');
let config = package.config;

let urlBase = new URL(config.qrUrlBase);
if(urlBase.hostname == "localhost"){
	const os = require('os');
	urlBase.hostname = os.hostname();
}
console.log(config.qrUrlBase);

const express = require('express');
const router = express.Router();
const appRoot = require('app-root-path');

router.get('/', function(req, res){
	const comments = req.query.comments;
	getOrPost(req, res, comments);
});

router.post('/', function(req, res){
	const comments = req.body.comments;
	getOrPost(req, res, comments);
});

function getOrPost(req,res,comments){
	const slugid = require('slugid');

	const dateObj = new Date();
	const qrFolder = getFolderNameYYYYMMDD(dateObj);
	const qrTimeStamp = getHHNNSS(dateObj);
	const qrPath = qrFolder + '/' + qrTimeStamp +'.' + slugid.nice();

	let qrText = urlBase.href + '/' + qrPath + '.html';

	let pngPath = generateStampImage(qrFolder, qrPath,qrText);

	const htmlFolder = 'static/qrstamp/'+qrFolder; 
	const htmlPath = 'static/qrstamp/'+qrPath+'.html';
	var info={
		qrTimeStamp: formatTimeStampForHTML(dateObj),
		comments: comments
	};
	generateStampInfoHtml(htmlFolder, htmlPath, info);

	res.sendFile(appRoot + '/' + pngPath);
};

function getFolderNameYYYYMMDD(date){
	return  date.getFullYear() + '/' +
		("0" + (date.getMonth()+1)).slice(-2) + 
		("0" + date.getDate()).slice(-2) 
}
function getHHNNSS(date){
	return  ("0" + date.getHours()).slice(-2) +
		("0" + date.getMinutes()).slice(-2) +
		("0" + date.getSeconds()).slice(-2)  
}
function formatTimeStampForHTML(date){
	return  date.getFullYear() + '/' +
		("0" + (date.getMonth()+1)).slice(-2) + '/' + 
		("0" + date.getDate()).slice(-2) + ' ' +
		("0" + date.getHours()).slice(-2) + ':' +
		("0" + date.getMinutes()).slice(-2) + ':' +
		("0" + date.getSeconds()).slice(-2)  
}
async function mySleep(ms){
	await new Promise(resolve => setTimeout(resolve, 5000));
}

function generateStampImage(qrFolder, qrPath, qrText){
	const fs = require('fs');
	const mkdirp = require('mkdirp');
	const {createCanvas, Image, ImageData} = require('canvas');
	const template = fs.readFileSync('template/template.png');
	var img = new Image;
	img.src = template;
	if(img.width !== 336){throw new Error('template width must be 336')}
	if(img.height !== 336){throw new Error('template height must be 336')}

	const canvas = createCanvas(img.width, img.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0,0, img.width, img.height);

	const qr = require('qr-image');

	const matrix = qr.matrix(qrText, 'L');
	const cellsize = 4;
	const cellnum = matrix.length
	if(cellnum > 41){throw new Error('url length too long');}
	console.log(cellnum);

	const qrTop = (img.width/2) -cellsize*(cellnum / 2);
	const qrLeft = qrTop;

	ctx.fillStyle = 'rgba(255,255,255,1)';
	ctx.fillRect(qrLeft-cellsize,qrTop-cellsize , cellsize*(cellnum+2), cellsize*(cellnum+2));

	ctx.fillStyle = 'rgba(63,0,0,1)';

	for(let x=0; x<cellnum; x++){
		for(let y=0; y<cellnum; y++){
			if(matrix[y][x]==1){
				ctx.fillRect(
					qrLeft + x * cellsize,
					qrTop + y * cellsize,
					cellsize, cellsize,
				);
			}
		}
	}
	var buf = canvas.toBuffer();
	const pngFolder = 'static/admin/qrstampImage/'+qrFolder; 
	const pngPath = 'static/admin/qrstampImage/'+qrPath+'.png';
	mkdirp.sync(pngFolder);
	fs.writeFileSync(pngPath,buf);
	return pngPath;
}
function generateStampInfoHtml(htmlFolder, htmlPath, info){
	const fs = require('fs');
	const mkdirp = require('mkdirp');
	const htmlCreator = require('html-creator');

	const html = new htmlCreator([
		{
			type: 'head',
			content: [{type:'title', content:'QR Stamp Info'}]
		},
		{
			type:'body',
			content: [
				{type:'h2', content:'QR角印捺印情報'},
				{type:'p', content:'下記の件について確かに捺印したことを表明します。'},
				{type:'p', content:'お手元の書類の捺印について疑義がある場合はご連絡ください。'},

				{type:'p', content:config.organizationName},
				{type:'p', content:config.representativeName},
				{type:'h3', content:'捺印日時'},
				{type:'p', content:info.qrTimeStamp},
				{type:'h3', content:'コメント'},
				{type:'p', content:info.comments}
			]
		}
		
	]);
	const htmlStr = html.renderHTML();
	
	mySleep(1200);
	mkdirp.sync(htmlFolder);
	fs.writeFileSync(htmlPath, htmlStr);
}


module.exports = router;

var express = require('express');
var cors = require('cors');
require('dotenv').config()
var multer = require('multer');
var upload = multer();
var app = express();

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/fileanalyse',upload.single('upfile'),function(req,res){
  if(req.file!= undefined){
    res.json({
      'name':req.file.originalname,
      'type':req.file.mimetype,
      'size':req.file.size
    })
  }else{
    res.end('Please upload a file')
  }
})
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});

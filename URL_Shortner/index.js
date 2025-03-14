require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const mongo = require('mongodb');
const {nanoid} = require('nanoid');
const dns = require('dns');
const bodyParser = require('body-parser');
const Url = require('./store');
var UrlencodedParser = bodyParser.urlencoded({extended:false});
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());


mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true,useUnifiedTopolgy:true})



app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl/new',UrlencodedParser,function(req,res){
  let isMatch =  /^(https?:\/\/)(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#()?&//=]*)/.test(req.body.url);
  if(!isMatch){
    res.json({error : "invalid URL"});
  }
  else{
    let url = new URL(req.body.url);
    dns.lookup(url.hostname,(err,adress,family)=>{
      if(err){
        res.send('invalid host')
      }
      else{
        Url.findOne({url:req.body.url}).then(function(doc){
          if(!doc){
            let short = nanoid(4)
            let new_url = new Url({
              url: req.body.url,
              srt_url : short
            });
            new_url.save().then(function () {
              console.log('New URL saved.');
            });

            res.json({ "original_url": req.body.url, "short_url": short_url });
          }
          else {
            res.json({ "original_url": doc.url, "short_url": doc.srt_url });
          }
        })
    }
  })
  }
})

app.get('/api/shorturl/:id', function (req, res) {
  Url.findOne({ srt_url: req.params.id }).then(function (doc) {
    if (!doc) {
      res.json({ "error": "No short url found for given input" });
    }
    else {
      res.redirect(doc.url);
    }
  });
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

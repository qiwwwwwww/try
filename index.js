//1 
var http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser'),
    path = require('path'),
    MongoClient = require('mongodb').MongoClient, 
	  Server = require('mongodb').Server, 
 	  CollectionDriver = require('./collectionDriver').CollectionDriver; 
    var mongo = require('mongodb');
    var BSON = require('bson').BSONPure;
    var Grid = require('gridfs-stream');
    var gfs;


var app = express();

app.set('port',process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));  
app.set('view engine', 'jade'); 

// parse application/json
app.use(bodyParser.json());                        

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
var mongoHost = 'localHost'; //A 
var mongoPort = 27017;  
var url = 'mongodb://localhost:27017/cheese'
var collectionDriver; 
 
var mongoClient = new MongoClient(new Server(mongoHost, mongoPort)); //B 
 
mongoClient.connect(url, function(err, mongoClient) { //C 
 
  if (!mongoClient) { 
 
      console.error("Error! Exiting... Must start MongoDB first"); 
 
      process.exit(1); //D 
 
  } 
 
  var db = mongoClient.db("cheese");  //E 
 
  collectionDriver = new CollectionDriver(db); //F 
  // gfs =Grid(db, mongo);
  gfs = Grid(db, mongo);

}); 


app.use(express.static(path.join(__dirname, 'public'))); 


// app.get('/:fileName',function(req, res, next){
//   var options = {filename: req.param('fileName')};
//   gfs.files.find(options).toArray(function(err, files) {
//     if(err) {
//       console.error(err);
//       return res.send(404);
//     }
//     var file=files[0];
//     var total=file.length;
//     if (req.headers['range']) {
//           res.statusCode = 206;
//           var range = req.headers.range;
//           var parts = range.replace(/bytes=/, "").split("-");
//           var partialstart = parts[0];
//           var partialend = parts[1];

//           var start = parseInt(partialstart, 10);
//           var end = partialend ? parseInt(partialend, 10) : total - 1;
//           var chunksize = (end - start) + 1;

//           // res.set("Content-Range", "bytes " + start + "-" + end + "/" + total);
//           // res.set("Accept-Ranges", "bytes");
//           // res.set("Content-Length", total);
//           // res.set("Content-Type", "video/webm");

//           var readstream = gfs.createReadStream({"_id": file._id, range: {startPos: start, endPos: end}});
//           readstream.pipe(res);
//   } else {
//           res.statusCode = 200;
//           res.set("Content-Length", total);
//           res.set("Content-Type", "video/webm");
//           var readstream = gfs.createReadStream({"_id": file._id});
//           readstream.pipe(res);
//   }
//    }); 
//   });



app.get('/:collection', function(req, res) { //A 
 
   var params = req.params; //B 
 
   collectionDriver.findAll(req.params.collection, function(error, objs) { //C 
 
          if (error) { res.send(400, error); } //D 
 
          else {  
 
              if (req.accepts('html')) { //E 
 
                  res.render('data',{objects: objs, collection: req.params.collection}); //F 
 
              } else { 
 
              res.set('Content-Type','application/json'); //G 
 
                  res.send(200, objs); //H 
 
              } 
 
         } 
 
    }); 
 
}); 
 
 app.get('/files/:id', function(req, res, next){
  
  var params = req.params;

  var readstream = gfs.createReadStream({
    '_id': new BSON.ObjectID(req.params.id)
  });

  req.on('error', function(err){
    res.send(500, err);
  });
  readstream.on('error', function(err){
    res.send(500, err);

  });
  readstream.pipe(res);
// gfs.exist({ "_id": req.params.fileId }, function(err, found) {
//     if (err) {
//       handleError(err); 
//       return;
//     }

//     if (!found) {
//       res.send('Error on the database looking for the file.')
//       return;
//     }

//     // We only get here if the file actually exists, so pipe it to the response
//     gfs.createReadStream({ "_id": req.params.fileId }).pipe(res);
// });

});


app.get('/:collection/:entity', function(req, res) { //I 
 
   var params = req.params; 
 
   var entity = params.entity; 
 
   var collection = params.collection; 
 
   if (entity) { 
 
       collectionDriver.get(collection, entity, function(error, objs) { //J 
 
          if (error) { res.send(400, error); } 
 
          else { res.send(200, objs); } //K 
 
       }); 
 
   } else { 
 
      res.send(400, {error: 'bad url', url: req.url}); 
 
   } 
 
}); 

app.post('/:collection', function(req, res) { //A 
 
    var object = req.body; 
 
    var collection = req.params.collection; 
 
    collectionDriver.save(collection, object, function(err,docs) { 
 
          if (err) { res.send(400, err); }  
 
          else { res.send(201, docs); } //B 
 
     }); 
 
}); 

app.put('/:collection/:entity', function(req, res) { //A 
 
    var params = req.params; 
 
    var entity = params.entity; 
 
    var collection = params.collection; 
 
    if (entity) { 
 
       collectionDriver.update(collection, req.body, entity, function(error, objs) { //B 
 
          if (error) { res.send(400, error); } 
 
          else { res.send(200, objs); } //C 
 
       }); 
 
   } else { 
 
       var error = { "message" : "Cannot PUT a whole collection" }; 
 
       res.send(400, error); 
 
   } 
 
}); 

app.delete('/:collection/:entity', function(req, res) { //A 
 
    var params = req.params; 
 
    var entity = params.entity; 
 
    var collection = params.collection; 
 
    if (entity) { 
 
       collectionDriver.delete(collection, entity, function(error, objs) { //B 
 
          if (error) { res.send(400, error); } 
 
          else { res.send(200, objs); } //C 200 b/c includes the original doc 
 
       }); 
 
   } else { 
 
       var error = { "message" : "Cannot DELETE a whole collection" }; 
 
       res.send(400, error); 
 
   } 
 
}); 


app.use(function (req,res) { //1 
  res.render('404', {url:req.url}); //2 
}); 

http.createServer(app).listen(app.get('port'), function(){ 
console.log('Express server listening on port ' + app.get('port'));  
}); 

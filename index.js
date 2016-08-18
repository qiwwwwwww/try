//1 
var http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser'),
    path = require('path'),
    MongoClient = require('mongodb').MongoClient, 
	  Server = require('mongodb').Server, 
 	  CollectionDriver = require('./collectionDriver').CollectionDriver; 

// for gridfs
var mongo = require('mongodb');
var BSON = require('bson').BSONPure;
var Grid = require('gridfs-stream');
var gfs;


var app = express();

app.set('port',process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));  

// parse application/json
app.use(bodyParser.json());                        

app.use(bodyParser.urlencoded({ extended: true }));
var mongoHost = 'localHost'; //A 
var mongoPort = 27017;  
var url = 'mongodb://localhost:27017/pancake'
var collectionDriver; 
 
var mongoClient = new MongoClient(new Server(mongoHost, mongoPort)); //B 
 
mongoClient.connect(url, function(err, mongoClient) { //C 
 
  if (!mongoClient) { 
 
      console.error("Error! Please start MongoDB first"); 
 
      process.exit(1); //D 
 
  } 
 
  var db = mongoClient.db("pancake");  //E 
 
  collectionDriver = new CollectionDriver(db); //F 
  gfs = Grid(db, mongo);

}); 


app.use(express.static(path.join(__dirname, 'public'))); 


app.get('/:collection', function(req, res) { //A 
 
   var params = req.params; //B 
 
   collectionDriver.findAll(req.params.collection, function(error, objs) { //C 
 
          if (error) { res.send(400, error); } //D 
 
          else {  
 
              if (req.accepts('html')) { //E 
 
                  res.send({objects: objs, collection: req.params.collection}); //F 
 
              } else { 
 
              res.set('Content-Type','application/json'); //G 
 
                  res.send(200, objs); //H 
 
              } 
 
         } 
 
    }); 
 
}); 
 
 // for gridfs
 app.get('/files/:id', function(req, res, next){
  
  var params = req.params;

  var readstream = gfs.createReadStream({
    '_id': new BSON.ObjectID(req.params.id)
  });

gfs.files.find({'_id': new BSON.ObjectID(req.params.id)}).toArray(function(err, files){
  if(err){
    console.error(err);
    return res.send(404);
  }
  var file=files[0];
  res.set('Content-disposition', 'attachment; filename=' + file.filename);
  res.set('Content-Type', 'application/vnd.android.package-archive');


  
 })

  req.on('error', function(err){
    res.send(500, err);
  });
  readstream.on('error', function(err){
    res.send(500, err);

  });
  readstream.pipe(res);


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


app.get('/category/:collection/:entity', function(req, res) { //I 
 
   var params = req.params; 
 
   var entity = params.entity; 
 
   var collection = params.collection; 
 
   if (entity) { 
 
       collectionDriver.getCategory(collection, entity, function(error, objs) { //J 
 
          if (error) { res.send(400, {'category':error}); } 
 
          else { res.send(200, {'category':objs}); } //K 
 
       }); 
 
   } else { 
 
      res.send(400, {error: 'bad url', url: req.url}); 
 
   } 
 
}); 

app.get('/filename/:collection/:entity', function(req, res) { //I 
 
   var params = req.params; 
 
   var entity = params.entity; 
 
   var collection = params.collection; 
 
   if (entity) { 
    
        entity= new RegExp(entity,'i');
       collectionDriver.getFilename(collection, entity, function(error, objs) { //J 
 
          if (error) { res.send(400,{'filename': error}); } 
 
          else { res.send(200, {'filename':objs}); } //K 
 
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
  res.send({url:req.url}); //2 
}); 

http.createServer(app).listen(app.get('port'), '0.0.0.0', function(){ 
console.log('Express server listening on port ' + app.get('port'));  
}); 

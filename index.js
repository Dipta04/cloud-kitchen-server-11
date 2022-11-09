const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ahr0ub7.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
  
    if(!authHeader)
    {
      return res.status(401).send({message: 'unauthorized access'});
    }
    const token = authHeader.split(' ')[1];
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
      if(err)
      {
        return res.status(403).send({message: 'Forbidden access'});
      }
      req.decoded = decoded;
      next();
    })
  
  }
  
  async function run(){
    try{
        const serviceCollection = client.db('kitchen').collection('services');
        const reviewCollection = client.db('kitchen').collection('reviews');
        const newserviceCollection = client.db('kitchen').collection('newservices');

        app.post('/jwt', (req, res) =>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d'})
            res.send({token})
      })

      app.get('/services', async(req, res) =>{
        const query = {}
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
       })

      app.get('/serviceshome', async(req, res) =>{
        const query = {}
        const cursor = serviceCollection.find(query);
        const services = await cursor.limit(3).toArray();
        res.send(services);
       })

       
       app.get('/services/:id', async(req, res) =>{
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const service = await serviceCollection.findOne(query);
        res.send(service);
      })

      app.get('/reviews', verifyJWT, async (req, res) => {
            
        const decoded = req.decoded;
        // if(decoded.email !== req.query.email)
        // {
        //    res.status(403).send({message: 'unauthorized access'})
        // }
        let query = {};

        if(req.query.email)
        {
          query = {
             email: req.query.email
          }
        }

        const cursor = reviewCollection.find(query);
        const reviews = await cursor.toArray();
        res.send(reviews);
    });

    app.post('/reviews', verifyJWT, async(req, res) =>{
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
   })

   app.patch('/reviews/:id', verifyJWT, async(req, res) =>{
    const id = req.params.id;
    const status = req.body.status;
    const query = { _id: ObjectId(id) }
    const updatedDoc = {
      $set:{
          status: status
      }
    }
    const result = await reviewCollection.updateOne(query, updatedDoc);
    res.send(result);
   })

   app.delete('/reviews/:id', verifyJWT, async(req, res) =>{
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await reviewCollection.deleteOne(query);
    res.send(result);
    })


    app.get('/newservices', verifyJWT, async (req, res) => {
      let query = {};
      // if(req.query.email)
      // {
      //   query = {
      //      email: req.query.email
      //   }
      // }

      const cursor = newserviceCollection.find(query);
      const newservices = await cursor.toArray();
      res.send(newservices);
  });
  app.post('/newservices', verifyJWT, async(req, res) =>{
    const  newservice= req.body;
    const result = await newserviceCollection.insertOne(newservice);
    res.send(result);
 })


    }
    finally{

    }
  }
  run().catch(error => console.error(error));

app.get('/', (req, res) => {
  res.send('cloud kitchen server is running')
})

app.listen(port, () => {
  console.log(`Cloud kitchen server running on ${port}`)
})
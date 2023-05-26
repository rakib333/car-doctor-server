const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken');


// middleware
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
    res.send('car doctor server is running')

})
// connection with mongodb


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@pherocluster.znbq6ro.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// jwt verify
const verifyJWT = (req, res, next) => {
    console.log('hitting', req.headers.authorization)
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized' })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET_CODE, (err, decoded) => {
        if (err) {
            return res.status(403).send({ error: true, message: "unauthorized" })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const carDoctorCollection = client.db('carDoctor').collection('services');
        const bookingCollection = client.db('carDoctor').collection('bookings');

        // get all data
        app.get('/services', async (req, res) => {
            const cursor = carDoctorCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        // get specific data
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };
            const result = await carDoctorCollection.findOne(query, options);
            res.send(result)
        })

        // bookings
        app.post('/booking', async (req, res) => {
            const bookingData = req.body;
            const result = await bookingCollection.insertOne(bookingData);
            res.send(result)
        })

        // single user bookings with query parameter
        app.get('/booking', verifyJWT, async (req, res) => {
            console.log('came back here')
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                return res.status(403).send({ error: true, message: 'Access forbidden' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }

            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })

        // delete user bookings
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)
            res.send(result)
        })

        // update status
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const updatedData = req.body;
            const updateDoc = {
                $set: {
                    status: updatedData.status
                },
            };
            const result = await bookingCollection.updateOne(query, updateDoc)
            res.send(result)
        })


        // jwt token authorization
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET_CODE, {
                expiresIn: '1h'
            })
            res.send({ token: token })
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`app running in port: ${port}`)
})
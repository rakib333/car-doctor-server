const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();


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
        app.get('/booking', async (req, res) => {
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
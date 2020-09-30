const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;

require('dotenv').config();
// console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.is4kq.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000

const app = express();
app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./configs/burj-al-arab-after-auth-firebase-adminsdk-2htvx-796d650b79.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});


// mongodb database connection
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");

    console.log('db connected successfully');

    // Create data
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                // console.log(result);
                res.send(result.insertedCount > 0)
            })
        console.log(newBooking);
    })

    // Read data
    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;

                    if (tokenEmail == queryEmail) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents)
                            })
                    }
                    else {
                        res.status(401).send('Error 401 - Unauthorized Access');
                    }

                }).catch(function (error) {
                    res.status(401).send('Error 401 - Unauthorized Access');
                });
        }
        else {
            res.status(401).send('Error 401 - Unauthorized Access');
        }

    })

    // client.close();
});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
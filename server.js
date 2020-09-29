import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbChikitsak.js'
import Pusher from "pusher"
import cors from 'cors'

const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1082004',
    key: 'b985966bbe3d82cec18d',
    secret: '06e445729feae3e7730e',
    cluster: 'ap2',
    encrypted: true
  });

app.use(express.json());

app.use(cors())

const connection_url = 'mongodb+srv://admin:zvE5pgsUnnBTtgd4@chikitsak.fl8o2.azure.mongodb.net/chikitsakdb?retryWrites=true&w=majority'
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection

db.once('open', ()=>{
    console.log('DB is connected');

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch();

    changeStream.on('change',(change)=> {
        console.log('A change occured', change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        }
        else {
            console.log("Error triggering Pusher");
        }
    });
});

app.get('/',(req,res)=>res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
})

app.listen(port, () =>console.log(`Listening on localhost:${port}`));
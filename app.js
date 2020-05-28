const express = require('express');
const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('./models/event');

const events = [];
const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input EventInput {
            title: String!
            description: String!
            price: Float
            date: String!
        }
        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
        }
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            // return events;
            return Event.find().then(events => {
                return events.map(event => {
                    return {...event._doc, _id: event.id};
                });
            }).catch(err => {throw err;});
        },
        createEvent: (args) => {
            // const event = {
            //     _id: Math.random().toString(),
            //     title: args.eventInput.title,
            //     description: args.eventInput.description,
            //     price: +args.eventInput.price,
            //     date: args.eventInput.date            
            // }
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date)           
            });
            return event.save().then(res => {
                console.log(res);
                return {...res._doc, _id: res._doc._id.toString()};
            }).catch(err => console.log(err));
            events.push(event);
            // return event;
        }
    },
    graphiql: true
}));
app.get('/', (req, res, next) => {
    res.send('Hello World');
});

// mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:
//     ${process.env.MONGO_PASSWORD}@cluster0-pxxtq.mongodb.net/test?retryWrites=true&w=majority`
// )
mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-pxxtq.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
.then(() => {
    console.log("connected")
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});
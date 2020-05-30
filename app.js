const express = require('express');
const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const Event = require('./models/event');
const User = require('./models/User');

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

        type User {
            _id: ID!
            email: String!
            password: String
        }
        input EventInput {
            title: String!
            description: String!
            price: Float
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }
        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find().then(events => {
                return events.map(event => {
                    return {...event._doc, _id: event.id};
                });
            }).catch(err => {throw err;});
        },
        createEvent: (args) => {
            let createdEvent;
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
                creator: '5ecfb1f7c822633650693f73'       
            });
            return event.save().then(res => {
                createdEvent = {...res._doc, _id: res._doc._id.toString()};
                return User.findById('5ecfb1f7c822633650693f73')
            })
            .then(user => {
                if (!user) {
                    throw new Error('User not found');
                }
                user.createdEvents.push(event);
                user.save();
            })
            .then(result => {
                return createdEvent;
            })
            .catch(err => console.log(err));
        },
        createUser: (args) => {
            return User.findOne({email: args.userInput.email}).then(user => {
                if (user) {
                    throw new Error('User exists already');
                }
                return bcrypt.hash(args.userInput.password, 12)
            }).then(hashedPassword => {
                const user = new User({
                    email: args.userInput.email,
                    password: hashedPassword,
                });
                return user.save();
            }).then(res => {
                console.log(res);
                return {...res._doc, password: null, _id: res.id};
            }).catch(err => {throw err;})
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
const express = require("express");
const uapp = express();
const utils =  require('./utils/task-schema.js')

uapp.use(express.json());

const tasks = [
    {
        username: "abc@gmail.com",
        password: "asdf",
        firstname: "snehal",
        lastname: "chavan"
    }
];

uapp.post('/createUser',(req,res) =>{
    const {error} = utils.validateTask(req.body);

    if(error) return res.status(400).send("The name should be atleast 3 characters long")

    const task = {
        username: req.body.name,
        password: req.body.password,
        firstname: req.body.firstname,
        lastname: req.body.lastname
    };

    tasks.push(task);
    res.status(201).send(task);
});

const port = process.env.PORT || 3000;
module.exports = uapp.listen(port, () => console.log(`listening on port ${port}...`));
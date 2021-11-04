let chai = require("chai");
let chaiHttp = require("chai-http");
let {emailIsValid} = require('../helperFunctions');
// const { response } = require("express");
// let server = require("../app");
var expect    = chai.expect;
//test
chai.should();

chai.use(chaiHttp);


let should = chai.should();





describe('Basic Mocha String Test', function () {

it("Returns is email is validate", function(){

// Running the function

test0 = emailIsValid('harshika@gmail.com')

test1 = emailIsValid('test')

// Comparing the results to expectations

console.log(test0);

expect(test0).to.equal(true);

expect(test1).to.equal(false);

})

});

// describe('Tasks API', ()=>{
//   describe("POST /users", () => {

//     const task = {
//       "username": "sne@gmail.com",
//       "password": "snehal",
//       "firstname": "sn",
//       "lastname": "ch"
//     };

//     var token ="c2hpdmFtQGdtYWlsLmNvbTpzaGl2YW0=";

//     xit("It should create user", (done) =>{
      
//       chai.request(server)
//         .post("/createUser")
//         .send(task)
//         .end((err, response) => {
//           response.should.have.status(201)
//           response.body.should.be.a('object');
//           response.should.have.property('username').eq("sne@gmail.com");
//           response.should.have.property('password').eq('snehal');
//           response.should.have.property('firstname').eq('sn');
//           response.should.have.property('lastname').eq('ch');
//         done();
//         });
//     });

//     xit("get user", (done) =>{
      
//       chai.request(server)
//         .get("/users")
//         .set({ "Authorization": `Basic ${token}` })
//         .end((err, response) => {
//           response.should.have.status(200);
//         done();
//         });
//     });

//     it("It should NOT POST a new task without the name property", (done) => {
//       const task = {
//         password: "snehal",
//         firstname: "sn",
//         lastname: "ch"
//       };
//       chai.request(server)                
//           .post("/api/tasks")
//           .send(task)
//           .end((err, response) => {
//               response.should.have.status(400);
//               response.text.should.be.eq("The name should be email!");
//           done();
//           });
//   });


  
//   });
  
// });


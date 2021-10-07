# webapp


``Rest API - Node.js``



## About the project

Created an node application to perform CRU operations using http request



## How To Run

* Download Node.js from the official site

* Clone the repository into your local machine using git clone command

* Install pgAdmin on your devise and set username and password, and also create a database and table</li>

* Go to your project folder using cd

* Write command npm i to install all dependencies

* Write command node api.js to run the project locally

* Now run the apis using localhost/postman or any api library of choice

## Project Structure

* **app.js** : It has it's logic to create server http and https and the API services.

* **connection.js** : It has database client information

* **app/createUser** : Main logic for creating users that includes create query

* **app/users/updateUser**: Main logic for updating users that includes update query

* **app/users** :: Main logic for fetching users that includes select query

* **test/task.js** :test/api.test.js: Contains unit test

## Teach Stack

NodeJs

ExpressJs Framework

PostgreSQL



## Features

Rest Apis

Base Authentication

Password Encryption



## Endpoints

/v1/user :



- **Methods: GET** :

- Description: Get User Data.

- Query Strings: none

- **Methods: POST** :

- Description: Create a new user.

- Body: first_name, last_name, phone, password

- **Methods: PUT** :

- Description: Update a user.

- Body: first_name, last_name, phone, password
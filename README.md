# API_MJC

![texte alt](data/medieval.jpg)

 <img align="left" src="conception/image/logo-noir.png" alt="drawing" width="90"/>  <h1 >Welcome of the repository  of the Guardians of the legend ! </h1>

## Description

#### This project aims to provide a website for a games club. The site is under construction.


## Stack

* **Front-end**

  * REACT
    * Webpack
    * Babel 
    * React-redux
    * Axios
    * Redux
    * SementiUI-React
    * SCSS
    * React-Router 



* **Back-end**
  * NODE.js
    * Express 
    * Sqitch
    * Joi
    * Mocha et chai 
    * PostgreSql
    * Bcrypt
    * Email-validator 
    * REDIS 
  
## Install the API

* First clone the repo => ```git clone <name_of_the_repo>```
* **Build your own .env.back file in the folder named "BACK", at the root. All the informations you need to copy and paste in your .env.back are in the .env.back.example**
* Go to the BACK folder to launch the API => ```cd BACK ```
* After installing [PostgreSQL](https://www.postgresql.org/download/), create a database under Postgres => ``` create database <name_of_my_DB> ```
* Install all [NPM](https://www.npmjs.com/) and all the npm packages you need for this project => ``` npm i ```
* After installing [sqitch](https://sqitch.org/download/), deploy squitch (versionning for database) => ```sqitch deploy  db:pg:<name_of_my_DB>```
* To launch the API => ``` npm start ```
* Go to your broswer, at the http://localhost:<PORT_you_put_in_your_.env.back>/v1
* Enjoy ! and don't forget, it's under construction :)

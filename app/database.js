// db est un pool de connecteurs de base de données


/**
 * db est un pool de connecteurs de base de données
 * @module - permet le lien avec la base de données postgreSQL
 */
const { Pool } = require('pg');

// ici, les informations de connection sont récupérées dans l'environnement
// PGHOST pour l'hôte
// PGUSER pour l'utilisateur
// PGPASSWORD pour le mot de passe
// PGDATABASE pour la base de données

const db = new Pool();

// maintenant, on n'a plus un seul connecteur (comme avec Client) mais un pool de connecteur (avec Pool)
module.exports = db;




 //! on creer  une slow db pour tester REDIS : 
 // ne pas oublier de remplacer db par slowDb dans les controller que l'on tester.

 // un random paramétrable
 //const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
 
 // une fonction qui attend un nombre aléatoire de millisecondes entre 50 et 500
 //const waitRandomly = async () => new Promise((resolve) => {
  //   setTimeout(resolve, random(500, 1500))
 //});
 
 // l'objectif pour légitimer Redis va être de ralentir notre Pool
 
 /* const slowDb = {
     query: async (...args) => {
         // étape 1 : un ralentissement
         // comment on attend ? avec une fonction maison
         await waitRandomly();
 
         // étape 2 : faire ce que fait le Pool
         return db.query(...args);
     }
 }
  */
 
 //module.exports = slowDb;


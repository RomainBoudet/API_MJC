// Un routeur, sur lequel on branche des routes et des MW qui leur correspondent
const {
  Router
} = require('express');

const router = Router();
const port = process.env.PORT || 5000;
//les MW de permission des routes
const auth = require('./middlewares/auth');
const admin = require('./middlewares/admin');
const moderateur = require('./middlewares/moderateur');

// le MW limitant le nombre de requetes pour un user (defense contre les attaques par Brute-Force)
const rateLimit = require("express-rate-limit");

//nos conrollers
const authController = require('./controllers/authController');
const mainController = require('./controllers/mainController');
const articleController = require('./controllers/articleController');
const gameController = require('./controllers/gameController');
const userController = require('./controllers/userController');
const eventController = require('./controllers/eventController');
const participantController = require('./controllers/participantController');


// implémentation de joi, avec un validator déja écrit dans le dossier "services".
const {
  validateQuery,
  validateBody,
  validateParams
} = require('./services/validator');
const userLoginSchema = require('./schemas/userLoginSchema');
const userSigninSchema = require('./schemas/userSigninSchema');
const userUpdateSchema = require('./schemas/userUpdateSchema');
const resetPwdSchema = require('./schemas/resetPwdSchema');
const articleSchema = require('./schemas/articleSchema');
const gameSchema = require('./schemas/gameSchema');
const eventSchema = require('./schemas/eventSchema');
const verifyEmailSchema = require('./schemas/verifyEmailSchema');
const resendEmailLinkSchema = require('./schemas/resendEmailLinkSchema');
const participantSchema = require('./schemas/participantSchema');

//Redis pour le cache
const cacheGenerator = require('./services/cache');
//Config de notre service de mise en cache via Redis, avec une invalidation temporelle de 15 Jours (en sec) en plus de l'invalidation événementielle.
 const { cache, flush } = cacheGenerator({
  ttl: 1296000, // 3600 *24 *15 
  prefix: "mjc",
});
 
// Config du module pour limiter le nombre de connexion sur la route /connexion => empeche toute attaque par Brute-Force. 
//Basé sur l'ip, un VPN le contourne (testé ;) )
const apiLimiter = rateLimit({
  windowMs: 3600 * 1000 * 10, // la fenetre de tir pour le nombre de connexion : 10h
  message: 'Vous avez dépassé la limite des 100 demandes de connexion en 10h !', 
  max: 100, //le nombre de connexion max pour la fenetre donnée.
});
router.use("/connexion", apiLimiter); // ici je choisi les routes ou je veux imposer une limitation.


// sur nos route avec params :
// (\d+) => sécurise le params et obligation de mettre un entier via une feature d'express, joi overkill ici, pour plus de controle, on passe une expression réguliére \d = [0-9] et + pour plusieurs chiffre mais pas zéro. Double antislash (\\) car un seul a déja une fonction (sert a "échapper")

//! DROITS D'ACCES :
//!-----------------------------------------------------------------------------------------
//! Un simple mot a ajouter aprés la route pour changer les droits d'accés :

//! Pour autoriser une route a tous les utilisateurs connéctés :
//on ajoute "auth" aprés la route   ex = router.get('/articles', auth, articleController.allArticles);
//! pour autoriser une route aux seuls administrateurs :
//on ajoute "admin" aprés la route  ex = router.get('/articles', admin, articleController.allArticles);
//! pour autoriser une route aux modérateurs ET au administrateurs :
//on ajoute "moderateur" apres la route  ex = router.get('/articles', moderateur, articleController.allArticles);

//! SQL RACCOURCIS POUR PG ADMIN
// SQL pour changer le role = UPDATE "user" SET group_id = 3 WHERE pseudo = 'agathe'; // valeur de group_id => [1 = Membre, 2 = Administrateur, 3 = Modérateur])
// SQL Pour changer le statut d'un email a TRUE =  UPDATE "user" SET verifyemail ='true' WHERE pseudo = 'agathe';

/**
 * Page d'acceuil du site des Gardiens de la légende
 * @route GET /v1/
 * @summary Une magnifique documentation swagger :)
 * @group acceuil
 * @returns {JSON} 200 - la page d'acceuil
 */
router.get('/', mainController.init);

/**
 * Une connexion
 * @typedef {object} connexion
 * @property {string} pseudo - pseudo
 * @property {string} password - password
 */
/**
 * Autorise la connexion d'un utilisateur au site.
 * Route sécurisée avec Joi et limité a 100 requetes par 10h pour le même user
 * @route POST /v1/connexion
 * @group connexion - Pour se connecter
 * @summary Autorise la connexion d'un utilisateur au site. Aprés validation de son email !
 * @param {connexion.Model} connexion.body.required - les informations qu'on doit fournir
 * @returns {JSON} 200 - Un utilisateur à bien été connecté
 */
router.post('/connexion', validateBody(userLoginSchema), authController.login);

/**
 * Une inscription
 * @typedef {object} inscription
 * @property {string} firstName - prénom
 * @property {string} lastName - nom de famille
 * @property {string} pseudo - pseudo
 * @property {string} emailAddress - email
 * @property {string} password - password
 * @property {string} passwordConfirm - la confirmation du password
 */
/**
 * Autorise la connexion d'un utilisateur au site.
 * Route sécurisée avec Joi
 * @route POST /v1/inscription
 * @group inscription - Pour s'inscire
 * @summary Inscrit un utilisateur en base de donnée
 * @param {inscription.Model} inscription.body.required - les informations d'inscriptions qu'on doit fournir
 * @returns {JSON} 200 - les données d'un utilisateur ont été inséré en BDD, redirigé vers la page de connexon
 */
router.post('/inscription', validateBody(userSigninSchema), userController.handleSignupForm);

/**
 * Un article
 * @typedef {object} articles
 * @property {number} id - id de l'article
 * @property {string} title - titre
 * @property {string} description - description du jeu
 * @property {string} createdDate - date de création
 * @property {string} updateDate - date de mise a jour
 * @property {number} authorId - référence a la table user
 * @property {number} tagId - référence a la catégorie de l'article
 */
/**
 * Affiche tous les articles.
 * @route GET /v1/articles
 * @group articles - gestion des articles
 * @summary Affiche tous les articles en base de donnée. Route mise en cache (REDIS)
 * @param {articles.Model} articles.body.required
 * @returns {JSON} 200 - Tous les articles
 */
router.get('/articles', cache, articleController.allArticles);

/**
 * Affiche un article.
 * @route GET /v1/articles/:id
 * @group articles - gestion des articles
 * @summary Affiche un article en base de donnée. Route mise en cache (REDIS)
 * @param {articles.Model} articles.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - Un article a été délivré
 */
router.get('/articles/:id(\\d+)', cache, articleController.oneArticle);

/**
 * Un jeux
 * @typedef {object} jeux
 * @property {number} id - id de l'événement
 * @property {string} title - titre
 * @property {number} minPlayer - nombre minimum de joueur
 * @property {number} maxPlayer - nombre minimum de joueur
 * @property {number} minAge - age minimum requis
 * @property {number} duration - durée moyenne de jeu
 * @property {number} quantity - nombre d'exemplaire du jeu
 * @property {string} purchasedDate - date de l'achat du jeu
 * @property {string} creator - nom du créateur du jeux
 * @property {string} editor - éditeur du jeu
 * @property {string} description - description du jeu
 * @property {string} year - année de sortie du jeu
 * @property {number} typeId - référence au type de jeu
 */
/**
 * Affiche tous les jeux.
 * @route GET /v1/jeux
 * @group jeux - gestion des jeux
 * @summary Affiche tous les jeux en base de donnée. Route mise en cache (REDIS)
 * @param {jeux.Model} jeux.body.required
 * @returns {JSON} 200 - Tous les jeux ont été délivré
 */
router.get('/jeux', cache, gameController.allGames);

/**
 * Affiche un jeux.
 * @route GET /v1/jeux/:id
 * @group jeux - gestion des jeux
 * @summary Affiche un jeux en base de donnée. Route mise en cache (REDIS)
 * @param {number} id.path.required - l'id à fournir
 * @param {jeux.Model} jeux.body.required
 * @returns {JSON} 200 - Un jeux a été délivré
 */
router.get('/jeux/:id(\\d+)', cache, gameController.oneGame);

/**
 * Un évenement
 * @typedef {object} evenement
 * @property {number} id - id de l'événement
 * @property {string} title - titre
 * @property {string} description - description
 * @property {string} eventDate - date de l'évenement
 * @property {string} createdDate - date de création
 * @property {string} updateDate - date de mise a jour
 * @property {number} creatorId - référence au nom de l'auteur de l'événement
 * @property {number} tagId - référence a la categorie de l'événement
 */
/**
 * Affiche tous les évenements.
 * @route GET /v1/evenements
 * @group evenement - gestion des évenements
 * @summary Affiche tous les évenements en base de donnée. Route mise en cache (REDIS)
 * @param {evenement.Model} evenement.body.required
 * @returns {JSON} 200 - Tous les évenements ont été délivré
 */
router.get('/evenements', cache, eventController.allEvent);
/**
 * Affiche un évenement.
 * @route GET /v1/evenements/:id
 * @group evenement - gestion des évenements
 * @summary Affiche un évenements en base de donnée. Route mise en cache (REDIS)
 * @param {evenement.Model} evenement.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - Un évenement a été délivré
 */
router.get('/evenements/:id(\\d+)', cache, eventController.oneEvent);


//Des forms en front seront nécéssaire pour faire fonctionner ces routes ...

//Routes pour procédure de vérification de mail : c'est si un utilisateur n'a pas vérifier son email dans les 24h apres l'inscription, il peut via cet route re-vérifier son mail quand il le souhaite. La route inscription comprend son propre envoi de mail pour vérifier son email sinon.
//ETAPE 1 => Route pour prendre un email dans le body, verifis ce qu'il faut, envoi un mail avec URL sécurisé incorporé + tolken, qui renvoit sur la route verifyEmail
/**
 * Envoie un email si l'utilisateur n'a pas valider son email la premiere fois aprés inscription et a attendu plus de 24h.
 * @route POST /resendEmailLink'
 * @group Vérification du mail
 * @summary Prend un mail en entrée et renvoie un email dessus si celui çi est présent en BDD.  Cliquer sur le lien dans l'email l'enmenera sur la route /verifyemail validera l'attribut verifyemail en BDD, autorisant ainsi la connexion. 
 * @param {evenement.Model} evenement.body.required
 * @returns {JSON} 200 - Un email a été délivré
 */
router.post('/resendEmailLink', validateBody(verifyEmailSchema), userController.resendEmailLink);


//ETAPE 2 => Reçois userId et Token en query, vérifis ce qu'il faut et change le statut en BDD de verifyemail dans la table user.
/**
 * Reçois userId et Token en query, vérifis ce qu'il faut et change le statut en BDD de verifyemail dans la table user.
 * @route GET /verifyEmail
 * @group Vérification du mail
 * @summary Route qui réceptionne le lien de la validation du mail avec un token en query et valide le mail en BDD. Front géré par le server. Back power !
 * @param {evenement.Model} evenement.body.required
 * @returns {JSON} 200 - l'attibut verifyemail du user est passé a TRUE. Il peut désoemais se connecter.
 */
router.get('/verifyEmail', validateQuery(resendEmailLinkSchema), userController.verifyEmail);

//Routes pour procédure de reset du mot de passe :
// ETAPE 1 => Route de reception pour l'envoi en 1er de l'email en body: renvoi un lien par mail + token sécurisé par clé dynamique pour aller sur un Form pour rentrer new infos !

/**
 * Envoie un email si l'utilisateur ne se souvient plus de son mot de passe, pour mettre en place un nouveau mot de passe de maniére sécurisé.
 * @route POST /user/new_pwd
 * @group Changement du mot de passe
 * @summary Prend un mail en entrée et renvoie un email dessus si celui çi est présent en BDD.  Cliquer sur le lien dans l'email l'enmenera sur la route /user/reset_pwd ou l'attent un formulaire
 * @param {evenement.Model} evenement.body.required
 * @returns {JSON} 200 - Un email a été délivré
 */
router.post('/user/new_pwd', validateBody(verifyEmailSchema), userController.new_pwd);
// ETAPE 2 => envoi en second newPassword, passwordConfirm et pseudo dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !

/**
*  envoi en second newPassword, passwordConfirm et pseudo dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
*  @route POST /user/reset_pwd
 * @group Changement du mot de passe
 * @summary  Reset du mot de passe. prend en entrée, newPassword, passwordConfirm et pseudo dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
 * @param {evenement.Model} evenement.body.required
 * @returns {JSON} 200 - Un nouveau mot de passe est entré en BDD
 */
router.post('/user/reset_pwd', validateBody(resetPwdSchema), validateQuery(resendEmailLinkSchema), userController.reset_pwd);

/**
 * Un utilisateur
 * @typedef {object} user
 * @property {number} id - id du jeu
 * @property {string} firstName - prénom
 * @property {string} lastName - nom de famille
 * @property {string} pseudo - pseudo
 * @property {string} emailAddress - email
 * @property {string} password - password
 * @property {string} inscription - date d'inscription
 * @property {string} avatar - chemin absolu jusqu' une image
 * @property {string} group_id - références a la table qui détient les rôles
 */
/**
 * Affiche tous les utilisateurs.
 * @route GET /v1/user
 * @group user - gestion des utilisateurs
 * @summary Affiche tous les utilisateurs en base de donnée. Route mise en cache (REDIS) *** Nécéssite un role Admin***
 * @param {user.Model} user.body.required
 * @returns {JSON} 200 - Tous les utilisateurs ont été délivré
 */

//Pour gérer les informations des users :
router.get('/user', admin, cache, userController.getAllUser);
/**
 * Affiche un utilisateur.
 * @route GET /v1/user/:id
 * @group user - gestion des utilisateurs
 * @summary Affiche un utilisateur en base de donnée. Route mise en cache (REDIS)*** Nécéssite un role Membre***
 * @param {user.Model} user.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - Un utilisateur a été délivré
 */
router.get('/user/:id(\\d+)', auth, cache, userController.getUserbyId);

/**
 * Supprime les informations d'un utilisateur.
 * @route DELETE /v1/user/:id
 * @group user - Les routes de notre API
 * @summary Supprimme un utilisateur en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Admin***
 * @param {user.Model} user.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - les données d'un utilisateur ont été supprimées
 */
router.delete('/user/:id(\\d+)', admin, flush, userController.deleteUserById);
/**
 * Permet de mettre à jour un article.
 * @route PATCH /v1/articles/:id
 * @group articles - gestion des articles
 * @summary Mets à jour un article en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {articles.model} articles.body.required
 * @returns {JSON} 200 - Un article a été créé
 */
router.patch('/articles/:id(\\d+)', auth, flush, validateBody(articleSchema, 'PATCH'), articleController.updateArticle);

/**
 * Permet de créer un nouvel article.
 * @route POST /v1/articles
 * @group articles - gestion des articles
 * @summary Insére un article en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {articles.model} articles.body.required
 * @returns {JSON} 200 - Un article a été créé
 */
router.post('/articles',auth, flush, validateBody(articleSchema, 'POST'), articleController.newArticle);

/**
 * Permet de supprimer un article.
 * @route DELETE /v1/articles/:id
 * @group articles - gestion des articles
 * @summary Supprime un article en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {articles.model} articles.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - Un article a été supprimé
 */
router.delete('/articles/:id(\\d+)', auth, flush, articleController.deleteArticle);

/**
 * Un jeux
 * @typedef {object} jeux
 * @property {number} id - id de l'événement
 * @property {string} title - titre
 * @property {number} minPlayer - nombre minimum de joueur
 * @property {number} maxPlayer - nombre minimum de joueur
 * @property {number} minAge - age minimum requis
 * @property {number} duration - durée moyenne de jeu
 * @property {number} quantity - nombre d'exemplaire du jeu
 * @property {string} purchasedDate - date de l'achat du jeu
 * @property {string} creator - nom du créateur du jeux
 * @property {string} editor - éditeur du jeu
 * @property {string} description - description du jeu
 * @property {string} year - année de sortie du jeu
 * @property {number} typeId - référence au type de jeu
 */


/**
 * Permet de créer un nouveau jeu
 * @route POST /v1/jeux
 * @group jeux - gestion des jeux
 * @summary Insére un jeu en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {jeux.model} jeux.body.required
 * @returns {JSON} 200 - Un jeu a été créé
 */
router.post('/jeux', auth, flush, validateBody(gameSchema, 'POST'), gameController.newGame);

/**
 * Permet de mettre à jour un jeu
 * @route PATCH /v1/jeux/:id
 * @group jeux - gestion des jeux
 * @summary Mets à jour un jeu en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {jeux.model} jeux.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - Un jeu a été mis à jour
 */
router.patch('/jeux/:id(\\d+)', auth, flush, validateBody(gameSchema, 'PATCH'), gameController.updateGame);

/**
 * Permet de supprimer un jeu
 * @route DELETE /v1/jeux/:id
 * @group jeux - gestion des jeux
 * @summary Supprimé un jeu en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {jeux.model} jeux.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - Un jeu a été supprimé
 */
router.delete('/jeux/:id(\\d+)', auth, flush, gameController.deleteGame);

/**
 * Permet de créer un nouvel évènement.
 * @route POST /v1/evenements
 * @group evenement - gestion des évènements
 * @summary Insére un évènement en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {evenement.model} evenement.body.required
 * @returns {JSON} 200 - Un évènement a été créé
 */
router.post('/evenements', auth, flush, validateBody(eventSchema, 'POST'), eventController.newEvent);

/**
 * Permet de créer un nouveau participant.
 * @route POST /v1/participants
 * @group participant - gestion des participants
 * @summary Insére un participant en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {evenement.model} evenement.body.required
 * @returns {JSON} 200 - Un évènement a été créé
 */
router.post('/participants', auth, flush, validateBody(participantSchema), participantController.addParticipant);

/**
 * Permet d'annuler une participation.
 * @route PATCH /v1/participants
 * @group participant - gestion des participants
 * @summary Annule une participation en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {evenement.model} evenement.body.required
 * @returns {JSON} 200 - Un évènement a été créé
 */
router.patch('/participants', auth, flush, participantController.cancelParticipant);

/**
* Permet de mettre à jour un évènement.
* @route PATCH /v1/evenements/:id
* @group evenement - gestion des évènements
* @summary Mets à jour un évènement en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
* @param {evenement.model} evenement.body.required
* @param {number} id.path.required - l'id à fournir
* @returns {JSON} 200 - Un évènement a été mis à jour
*/
router.patch('/evenements/:id(\\d+)', auth, flush, validateBody(eventSchema, 'PATCH'), eventController.updateEvent);

/**
 * Permet de supprimer un évènement.
 * @route DELETE /v1/evenements/:id
 * @group evenement - gestion des évènements
 * @summary Supprime un évènement en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {evenement.model} evenement.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - Un évènement a été supprimé
 */
router.delete('/evenements/:id(\\d+)', auth, flush, eventController.deleteEvent);


/**
 * Modifit les informations d'un utilisateur.
 * @route PATCH /v1/user/:id
 * @group user -  gestion des utilisateurs
 * @summary Modifit un utilisateur en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {user.Model} user.body.required - les informations du user que l'on peut fournir
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - les données d'un utilisateur ont été mis a jour
 */
router.patch('/user/:id(\\d+)', auth, flush, validateBody(userUpdateSchema), userController.updateUser);

/**
 * Permet la déconnexion d'un utilisateur au site. Nécéssite un token dans le cookie le xsrfToken du local storage
 * @route GET /v1/deconnexion
 * @group deconnexion - Pour se déconnecter
 * @summary déconnecte un utilisateur - on reset les infos du user en session
 * @returns {JSON} 200 - Un utilisateur a bien été déconnecté
 */
router.get('/deconnexion', auth, authController.deconnexion);


/**
 * Redirection vers une page 404
 */
router.use((req, res) => {
  res.status(404).send(`La route choisie n\'existe pas : https://localhost:${port}/api-docs#/`);
});




module.exports = router;
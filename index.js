// je require les info de connexion qui sont dans un point env précis en passant en argument la localisation du .env.back 
require('dotenv').config({ path: `${__dirname}/.env.back` });

// on récupére ce dont on a besoin pour monter un seveur https
const fs = require('fs');
//parce que c'est beau la couleur ;)
const chalk = require ('chalk');
//Mise en place d'un logger pour garder une trace écrite des connexion
const logger = require ('./app/services/logger');

// on require les modules nécéssaire : 
const cors = require('cors');
const expressSanitizer = require('express-sanitizer');
const express = require('express');
const session = require('express-session');
const redisSession = require('redis');
const helmet = require('helmet');
const router = require('./app/router');
const cookieParser = require("cookie-parser");
const uuid = require(`uuid`)

//passage de notre api en https2 ! l'API des champions !
// et Jamy, c'est quoi du http2 ? => https://http2.github.io/faq/  => https://fr.wikipedia.org/wiki/SPDY 
const spdy = require('spdy');
//la version native de node, a testé si plus de temps => https://nodejs.org/api/http2.html#http2_server_side_example
//const http2 = require('http2');

//connect-redis permet d'utiliser Redis avec express-session pour stocker les cookies de la session sur Redis et non en mémoire (pas bien en prod!)
let RedisStore = require('connect-redis')(session);
let redisClient = redisSession.createClient();

const app = express();

//on utilise la variable d'environnement PORT pour attribuer un port à notre appli express ou port par défault
const port = process.env.PORT || 5000;

// Mise en place de swagger pour plus tard quand on voudra documenter notre API => https://www.npmjs.com/package/express-swagger-generator 
//-----------------------------------------------------------------------------------
const expressSwagger = require('express-swagger-generator')(app);
let optionsSwagger = require('./swagger-config.json');
optionsSwagger.basedir = __dirname; // __dirname désigne le dossier du point d'entrée
optionsSwagger.swaggerDefinition.host = `localhost:${port}`;
expressSwagger(optionsSwagger);
//! pas sur que ça soit top pour la sécurité en prod de laisser un plan swagger, parfait pour connaitre les endpoints pour une attack CSRF..
//FIN DE LA CONFIGURATION DE SWAGGER-----------------------------------------------------------

//configuration pour utiliser EJS comme moteur de templates //
//----------------------------------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', 'app/views');

//app.use(express.static(__dirname + '/public'));

//Nos Middlewares :
//-----------------------------------------------------------------------------------
//On se prémunit des failles xss avec ce module qui filtre, comme Joi avec .alphanum() (ou il est installé), nos entrés, en enlevant tout tag html et balise notamment
//app.use(sanitizer);
app.use(expressSanitizer());
// un seul des deux devrait être utile mais aprés test, sanitizer laisse passer des chevrons :( Se pencher dessus, je dois mal l'implémenter.



// module de log d'identification : me donne l'ip, l'heure et l'url de chaque connexion => en console ET en dur dans le dossier logs
app.use(logger);

// le parser JSON qui récupère le payload quand il y en a un et le transforme en objet JS disponible sous request.body
app.use(express.json()); 

//cookie parser, qui me permet d'avoir accés a req.cookies dans mes MW auth, admin et moderateur
app.use(cookieParser(process.env.SECRET));

// on va devoir gérer des données en POST, on ajoute le middleware urlencoded pour récupérer les infos dans request.body 
app.use(express.urlencoded({extended: true})); 

// je récupére un uuid que je vais passer a l'objet locals pour le récupérer dans a vue, et au passage le faire changer dans mas CSP égalemnt de maniére dynamique
// Même si uuid n'a pas de dépendance...a voir si j'ai intéret a le remplacer par crypto.randomBytes() ... ?
app.use((req, res, next) => {
  res.locals.nonce = uuid.v4()
  next()
})

//helmet : une collection de neuf fonctions middleware qui définissent des en-têtes HTTP liés à la sécurité, protége nottament du reniflage du code MIME et du clicjacking. Fonctions d'helmet que l'on peut trouver sur le lien suivant..
//helmet : https://expressjs.com/fr/advanced/best-practice-security.html 
//les base de la sécurité sur Node : https://blog.risingstack.com/node-js-security-checklist/
//app.use(helmet()); ça, c'est si on veut tous les blocages... 
// hsts définit l’en-tête Strict-Transport-Security qui impose des connexions (HTTP sur SSL/TLS) sécurisées au serveur. 
// une gestion fine de la CSP => https://ponyfoo.com/articles/content-security-policy-in-express-apps 
// CSP ==> Késséssé ? : https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP 
app.use(helmet());

//je dois configurer la CSP pour autoriser mon serveur a utiliser du CSS et mes images cloud pour le rendu de la validation du mail
 app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: [`'self'`], // le fallback, pas présent par défault, 
    imgSrc: [`self`,`filedn.eu`], //je configure helmet pour la CSP : ok pour aller chercher mes images sur mon cloud perso, tout le reste, ça dégage !
    //styleSrc: [ `self`,"'unsafe-inline'""] // ça s'était avant d'utiliser l'attribut nonce ! A bannir pour une CSP efficace... c'est pourquoi j'utilise uuid
    styleSrc: [ (_, res) => `'nonce-${ res.locals.nonce }'`], // je peux utiliser res ici je suis dans un app.use ! Je convertis dynamiquement le nonce de ma vue avec cette méthode, sans avoir besoin de mettre 'unsafe-inline' pour lire CSS de ma vue, ce qui affaiblirait considérablement ma CSP ! 
    upgradeInsecureRequests: [] // On convertit tout ce qui rentre en HTTP et HTTPS direct !
  }
}))
// ATTENTION cette protection contre les reflextive XSS pourrait être la porte ouverte pour les attaques XS search.. :
//https://infosecwriteups.com/xss-auditor-the-protector-of-unprotected-f900a5e15b7b
//https://portswigger.net/research/top-10-web-hacking-techniques-of-2019
//https://github.com/xsleaks/xsleaks/wiki/Browser-Side-Channels
// risque de XS leak important, des attaquant peuvent soutirer des infos en provoquant des faux postive, l'API XSS filter étant sensible a ce type d'attaque..
// cette option override celle de helmet qui la méttait a 0
app.use((req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});


//mise en place du système de sessions pour stocker les infos utilisateur // https://www.npmjs.com/package/express-session
app.use(
  session({
    store: new RedisStore({ client: redisClient }), // et nos cookies sont stockés sur REDIS !
    resave: true, // Resauver la session à chaque requête -> pour prolonger la durée de vie
    saveUninitialized: true, // Permet de sauver automatiquement la session d'un visiteur sans que j'ai à l'intialiser moi-même
    secret: process.env.SECRET, // le .env est dans la variable SECRET du .env.back
    cookie: {
      secure: true, //si true, la navigateur n'envoit que des cookie sur du HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 15, // ça fait une heure * 24h * 15 jours
      httpOnly: true, // Garantit que le cookie n’est envoyé que sur HTTP(S), pas au JavaScript du client, ce qui renforce la protection contre les attaques de type cross-site scripting.
      sameSite: 'strict',       //le mode Strict empêche l’envoi d’un cookie de session dans le cas d’un accès au site via un lien externe//https://blog.dareboost.com/fr/2017/06/securisation-cookies-attribut-samesite/
      //!il faudra définir les options de sécurité pour accroitre la sécurité. (https://expressjs.com/fr/advanced/best-practice-security.html)
      //domain: 'example.com',  Indique le domaine du cookie ; utilisez cette option pour une comparaison avec le domaine du serveur dans lequel l’URL est demandée. S’ils correspondent, vérifiez ensuite l’attribut de chemin.
      //path: 'foo/bar', Indique le chemin du cookie ; utilisez cette option pour une comparaison avec le chemin demandé. Si le chemin et le domaine correspondent, envoyez le cookie dans la demande.
      //expires: expiryDate, Utilisez cette option pour définir la date d’expiration des cookies persistants.
    },
  })
);

// Je require le middleware pour dire à express d'être plus permissif sur l'origine des requête

    app.use(cors({
  optionsSuccessStatus: 200,
  credentials: true, // pour envoyer des cookies et des en-têtes d'autorisations faut rajouter une autorisation avec l'option credential
  origin: false, //'https://localhost:8080', // true = req.header('Origin') //! a pas oublier pour la prod ! => remplacer par le bon nom de domaine
  methods: "GET, PUT, PATCH, POST, DELETE", // ok via un array aussi
  allowedHeaders : ['Content-Type', 'x-xsrf-token'],
})); 
 
//FIN DES MIDDLEWARES----------------------------------------------------------------------

// on préfixe notre router avec un V1 qui sera inclus devant chaque nom de route. Permet de faire évoluer l'app avec une V2 plus facilement.
app.use('/v1', router);

//On récupère notre clé privée et notre certificat (ici ils se trouvent dans le dossier certificat) pour https
const key = fs.readFileSync(process.env.SSL_KEY_FILE);
const cert = fs.readFileSync(process.env.SSL_CRT_FILE);

//ici path.join, prend les arguments et normalise le chemin comme un grand.
// key = la clé privée du sous domain 
// cert = certificat du sous-domain 
// la création d'une clé ssl et d'un certificat prend un peu de temps a comprendre (enfin pour ma part), mais vous retrouverez de la doc dans le fichier.txt du dossier certificat

// les options que l'on va passer pour la config du https.
const options = { key, cert };

/* Puis on créer notre serveur HTTPS SPEEDY avec les option qui sont le certificat et la clé */
spdy.createServer(options, app).listen(port, () => {
  console.log(chalk.cyan`API Back jeux de société Running on`,chalk.magenta.bold.inverse`https`,chalk.cyan`://localhost:${port}`);
});

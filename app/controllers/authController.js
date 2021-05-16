const User = require('../models/user');
const crypto = require('crypto');
const chalk = require('chalk');

const {
    strict
} = require('../schemas/userLoginSchema');


/**
 * Une méthode qui prend en charge la connexion d'un utilisateur déja inscrit dans la BDD
 * Une méthode qui vérifit que l'utilisateur existe en BDD et compare son mot de passe avec son hash présent en BDD via bcrypt
 * Retourne un json
 * @name handleLoginForm
 * @method handleLoginForm
 * @property {string} pseudo - le pseudo qu'un utilisateur utilise pour se connecter, doit être unique en BDD et inséré dans le formulaire de connexion.
 * @property {string} password - le mot de passe qu'un utilisateur utilise pour se connecter.
 * @param {Express.Request} request - l'objet représentant la requête
 * @param {Express.Response} response - l'objet représentant la réponse
 * @return {String}  - Un token construit via la méthod sign du package jsonwebtoken
 * @return {boolean} - une valeur de connexion true ou false
 */
const authController = {


    login: async (request, response) => {
        try {

            //on cherche à identifier le user à partir de son pseudo (qu'on a au préalable sanitizé pour éviter une petite attaque xss ;)
            const pseudo = request.sanitize(request.body.pseudo);

            const {
                password
            } = request.body;

            // On authentifie le user via son pseudo et le password proposé
            const userInDb = await User.authenticate(pseudo, password);
            console.log("Les propriété du user demandé pour authentification : ", userInDb);
            if (!userInDb) {
                return response.status(404).json("Erreur d'authentification : le pseudo ou le mot de passe est incorrect ");
            }


            //ici si l'utilisateur a bien vérifié son email (TRUE)
            if (userInDb.verifyemail) {
                console.log("La vérification du mot de passe a réussi !");
                console.log("Le role du user est =>", userInDb.group_name);


                //le user existe et s'est correctement identifié, on stocke les infos qui vont bien dans la session
                request.session.user = {
                    firstname: userInDb.firstName,
                    lastname: userInDb.lastName,
                    pseudo: userInDb.pseudo,
                    email: userInDb.emailAddress,
                    role: userInDb.group_name,
                };

                console.log("request.session.user =>", request.session.user);

                //LocalStorage => sensible aux attaques XSS // faille Cross site Scripting ! injection du contenu dans une page web
                //Cookies => sensible aux attaques CSRF // Cross Site Request Forgery , faille qui consiste simplement à faire exécuter à une victime une requête HTTP à son insu

                //ici on envoie un petit token identique dans le body pour qu'il soit stocké en front dans le localstorage et lemême mais dnas un cookie. Quand le front passe ces deux informations au server, les deux token doivent matcher.


                /* On créer le token CSRF qui partira avec le body */
                const xsrfToken = crypto.randomBytes(70).toString('hex');
                console.log("xsrfToken =>", xsrfToken);

                // On créer le cookie contenant token CSRF. On comparera les deux au retour.
                //sameSite: strict  => Le cookie concerné par cette instruction ne sera envoyé que si la requête provient du même site web
                response.status(201).cookie('xsrfToken', xsrfToken, {
                    httpOnly: true, // Garantit que le cookie n’est envoyé que sur HTTP(S), pas au JavaScript du client, ce qui renforce la protection contre les attaques de type cross-site scripting.
                    secure: true, // si true, la navigateur n'envoit que des cookie sur du HTTPS
                    sameSite: 'strict', //le mode Strict empêche l’envoi d’un cookie de session dans le cas d’un accès au site via un lien externe//https://blog.dareboost.com/fr/2017/06/securisation-cookies-attribut-samesite/
                    signed: true, // on devra utiliser req.signedCookies au retour ! 
                    maxAge: 1000 * 60 * 60 * 24,
                    //Maxage est non spécifié, cela crée un cookie de session automatiquement
                });


                /**
                 * Cette option n'est pas présente en front, mais laissons ce bout de code a disposition :)
                 * Si l'utilisateur a coché la case 'se souvenir de moi, on ajoute une heure de validité à sa session
                 * il peut ainsi quitter son navigateur et revenir sur la page, il devrait rester connecté
                 * on indique en date d'expiration la date courante + une heure (en millisecondes)
                 */
                /*  if (request.body.remember) {
                     request.session.cookie.expires = new Date(Date.now() + 3600000);
                 } */



                // On envoie une reponse JSON concernant les infos du user avec le token a comparé avec celui dans le cookie.
                response.status(200).json({
                    xsrfToken: xsrfToken,
                    logged: userInDb.verifyemail,
                    id: userInDb.id,
                    pseudo: userInDb.pseudo,
                    firstname: userInDb.firstName,
                    lastname: userInDb.lastName,
                    email: userInDb.emailAddress,
                    role: userInDb.group_name,
                });

                console.log(`L'utilisateur ${userInDb.firstName} ${userInDb.lastName} a bien été authentifié.`);


            } else {

                console.log("Accés non autorisé : Merci de vérifier votre email en cliquant sur le lien dans l'email envoyé.");
                /**df
                 * @return {String} - En cas d'échec de l'autentification on renvoie le statue de l'érreur et une explication en json 
                 */
                return response.status(401).json("Accés non autorisé : Merci de vérifier votre email en cliquant sur le lien dans l'email envoyé lors de l'inscription.");
            }


        } catch (error) {
            console.trace('Erreur dans la méthode login du authV2Controller :',
                error);

            response.status(500).json(error.message);
        }

    },

    deconnexion: async (req, res) => {
        try {

          
            req.session.user = false;
            //on redirige sur la page d'accueil
            console.log("utilisateur déconnecté ! valeur de req.user maintenant ==> ", req.session.user)
            return res.status(200).json("L'utilisateur a été déconnecté");

        } catch (error) {
            console.trace(
                'Erreur dans la méthode deconnexion du userController :',
                error);
            res.status(500).json(error.message);
        }

    },


}

module.exports = authController;
const User = require('../models/user');
const crypto = require('crypto');
const validator = require("email-validator");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jsonwebtoken = require('jsonwebtoken');
const {
  message
} = require('../schemas/userLoginSchema');
const {emailheaderVerify, emailfooterVerify, emailfooterUpdate, emailTextUpdate, emailTextUpdateNewEmail, emailFooterUpdateNewEmail, emailTextUpdateNewPassword, emailFooterNewPassword} = require('../email/html')


/**
 * Une variable d'environnement qui est présent dans le .env.back contenant la clé secréte utiisé pour générer le token
 * @param {Express.JWT_SECRET} - la clé secréte et sensible qui signe le token envoyé.
 */
const jwtSecret = process.env.JWT_SECRET;

/**
 * Le controller chargé de centraliser les appels a la base de données concernant les utilisateurs
 * Il gére également la connexion et et l'inscription des utilisateurs
 */
const userController = {
  /**
   * Methode chargé d'aller chercher les informations relatives à tous les utilisateurs
   * @param {Express.Request} req - l'objet représentant la requête
   * @param {Express.Response} res - l'objet représentant la réponse
   */
  getAllUser: async (req, res) => {
    try {
      const users = await User.findAll();

      res.status(200).json(users);
    } catch (error) {
      console.trace('Erreur dans la méthode getAllUser du userController :',
        error);
      res.status(500).json(error.message);
    }
  },
  /**
   * Methode chargé d'aller chercher les informations relatives à un utilisateur
   * @param {Express.Request} req - l'objet représentant la requête
   * @param {Express.Response} res - l'objet représentant la réponse
   * @param {req.params.id} req.params.id - le numéro identifiant un utilisateur précis
   */
  getUserbyId: async (req, res) => {
    try {
      const user = await User.findOne(req.params.id);
      res.json(user);

    } catch (error) {
      console.trace('Erreur dans la méthode getUserbyId du userController :',
        error);
      res.status(500).json(error.message);
    }
  },

  /**
   * Methode chargé de supprimer les informations relatives à un utilisateur
   * @param {Express.Request} req - l'objet représentant la requête
   * @param {Express.Response} res - l'objet représentant la réponse
   *  * @param {req.params.id} req.params.id - le numéro identifiant un utilisateur précis
   */
  deleteUserById: async (req, res) => {

    try {

      const userInDb = await User.findOne(req.params.id);

      id = userInDb.id

      const user = await User.delete(id);

      res.json(user);

    } catch (error) {
      console.trace('Erreur dans la méthode DeleteUserById du userController :',
        error);
      res.status(500).json(error.message);
    }
  },

  //!------------------------GESTION DES FORMULAIRES-------------------------------------------------


  /**
   * Methode chargé d'envoyer le formulaire de connexion
   * @param {Express.Request} req - l'objet représentant la requête
   * @param {Express.Response} res - l'objet représentant la réponse
   * @return {View} - l'objet renvoyant une view
   */
  loginForm: (req, res) => {
    //on envoie le formulaire de connexion => vue ejs login temporaire ou voire avec Laura ?
    res.render('login');
  },


  /**
   * Une méthode qui prend en charge l'inscription d'un utilisateur dans la BDD
   * Une méthode qui vérifit que l'adresse email de l'utilisateur n'existe pas en BDD, vérifit la validité de son email, la robustesse de son mot de passe
   * Hash son mot de passe et insére l'ensemble de ses informations en BDD
   * @name handleSignupForm
   * @method handleSignupForm
   * @property {string} fisrtName - Le firstname de l'utilisateur, devant contenir au minimum 2 caractéres, sans espaces.
   * @property {string} lastName - le lastname de l'utilisateur devant contenir au minimum 2 caractéres, sans espaces.
   * @property {string} emailAddress - l'adresse email d'un utilisateur, ne doit pas déja être enrgistré en BDD et correspondre a un format valide
   * @property {string} pseudo - le pseudo qu'un utilisateur utilise pour se connecter, ne doit pas être identique a un autre pseudo et contenir au minimum 3 caractéres et 40 au maximum, sans espace. 
   * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
   * @property {string} passwordConfirm - doit être identique au password
   * @param {Express.Request} request - l'objet représentant la requête
   * @param {Express.Response} response - l'objet représentant la réponse
   * @return {String}  - Un texte en json informant de la rentré en BDD d'un nouveau utilisateur.
   */


  handleSignupForm: async (request, response) => {
    try {

      // via express sanitizer on se protége de toute attaque xss avec l'injection de script dans notre BDD, avec un user qui aurait la bonne idée de s'appeler: <script>.....
      // si a l'avenir on veut être plus permissive avec les pseudo pour autorisé autre chose que l'alphanumérique sans espace, on pourra enlever le .alphnum() dans Joi, on sera toujours protégé de l'injection xss via sanitize.
      const firstName = request.sanitize(request.body.firstName);
      const lastName = request.sanitize(request.body.lastName);
      const pseudo = request.sanitize(request.body.pseudo);
      const email = request.sanitize(request.body.emailAddress);
      //password et passwordConfirm son géré par la REGEX de Joi, je ne souhaite pas que expressSanitizer enléve des caractéres spéciaux du mot de passe.
      //l'email posséde également sa double sécurité avec la regex dans Joi et le validator (qui aprés essais, vire bien les tentative d'injection de balise script !)
      //sachant qu'ici, avant que sanitize rentre en action, la tentive d'injection de scirpt sera arrété par Joi via le .alphanum LA OU IL EST PRESENT UNIQUEMENT dans le schéma bien sur

      console.log("firstName => ", firstName);
      console.log("request.body.firstName non sanitizé =>", request.body.firstName);
      //on check si un utilisateur existe déjà avec cet email

      // vérif de sécurité en plus de la REGEX de Joi et de expressSanitizer
      console.log("request.body.emailAddress => ", email);
      //on ne recherche que l'email a un format valide
      if (!validator.validate(email)) {
        //le format de l'email est incorrect
        return response.json('Le format de l\'email est incorrect');
      }

      //on checke si le password et la vérif sont bien identiques
      if (request.body.password !== request.body.passwordConfirm) {
        return response.json(
          'La confirmation du mot de passe est incorrecte'
        );
      }

      const userInDb = await User.findByEmail(email);

      // on check l'email :
      if (userInDb.emailAddress) {
        //il y a déjà un utilisateur avec cet email, on envoie une erreur
        return response.json('Cet email n\'est pas disponible');
      }

      // on check le pseudo :
      const pseudoInDb = await User.findByPseudo(pseudo);

      if (pseudoInDb.pseudo) {
        //il y a déjà un utilisateur avec cet email, on envoie une erreur
        return response.json('Ce pseudo n\'est pas disponible');
      }



      // on est OK pour une inscription en BDD ! hash du MDP => insertion en BDD


      /**
       * Une fonction asynchrone qui hash le mot de passe du nouvel utilisateur avant de l'insérer dans la BDD
       * @name hashedPwd
       * @function
       */
      const hashedPwd = await bcrypt.hash(request.body.password, 10)
      console.log(request.body.password, 'est devenu', hashedPwd);

      /**ff
       * Un fichier json qui contient les informations de l'utilisateur préparé pour être inséré en BDD
       * @type {json} 
       */
      const newUser = {
        pseudo: pseudo,
        emailAddress: email,
        password: hashedPwd,
        lastName: lastName,
        firstName: firstName,
      };


      console.log("newUser => ", newUser);
      /**
       * On créer une nouvelle instance de User 
       * */
      const userNowInDb = new User(newUser);
      console.log("userNowInDb => ", userNowInDb);
      /**
       * On l'envoie en BDD pour être enregistré
       */
      await userNowInDb.save();




      console.log(`L'user ${newUser.firstName} ${newUser.lastName} est désormais enregistré dans la BDD sans que sont email soit enregistré. `);

      //! on envoie un mail pour vérifier l'email de l'utilisateur 

      // on va envoyer un token via la query avec dans le token, des infos sur l'émmetteur et le recepteur, donc quand on décode le token apres le clique du user sur notre endpoint, et qu'on rteouve ces infos, bingo, c'est bien le 

      const jwtOptions = {
        issuer: userNowInDb.pseudo,
        audience: 'Lesgardiensdelalégende',
        algorithm: 'HS512',
        expiresIn: '24h' // ExpireIn est par default en seconde. Ici définit à 3 heures.
      };

      const jwtContent = {
        userId: userNowInDb.id,

      };

      const newToken = jsonwebtoken.sign(jwtContent, jwtSecret, jwtOptions);

      async function main() {

        //on généree un compte de service SMTP
        // je créer un objet "transporteur" réutilisable à l'aide du transport SMTP par défaut
        // (Pour tester sans créer d'email => https://mailtrap.io/ : config pour mailtrap dans mes notes !)
        //ici le test est avec une adresse mail test créer nodeMailer : lesgardiensdelalegende@gmail.com => code accés dans slack. On voit les messages envoyés via nodemailer dans les "messages envoyés" 

        const host = request.get('host');
        const link = `https://${host}/v1/verifyEmail?userId=${userNowInDb.id}&token=${newToken}`;
        console.log("req.get =>", request.get);
        console.log("ici host vaut =>", host);
        console.log("ici link vaut => ", link);
        console.log("newToken => ", newToken);
        console.log("firstName => ", userNowInDb.firstName);


        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL, // L'adresse mail qui va servir pour l'envoi, mais elle n'est pas visible par le destinataire ! Ces accés sont à coller dans le .env.back et sont présent sur le slack.
            pass: process.env.PASSWORD_EMAIL, // Le mot de passe qui va avec 
          },
        });

        // l'envoie d'email définit par l'object "transporter"
        const info = await transporter.sendMail({
          from: 'lesgardiensdelalegende@gmail.com', //l'envoyeur
          to: `${userNowInDb.emailAddress}`, // le ou les receveurs => `${request.body.emailAddress}`
          subject: `Les gardiens de la légende : merci de confirmer votre email`, // le sujet du mail
          text: `Bonjour ${userNowInDb.firstName} ${userNowInDb.lastName}, merci de cliquer sur le lien pour vérifier votre email auprés du club de jeu Les gardiens de la légende.`, // l'envoie du message en format "plain text" ET HTML, permet plus de souplesse pour le receveur, tout le monde n'accepte pas le format html pour des raisons de sécurité sur ces boites mails, moi le premier ! 
          html: emailheaderVerify+`<h3>Bonjour <span class="username"> ${userNowInDb.firstName} ${userNowInDb.lastName}, </span> </h3> <br>
              <p>Vous souhaitez vous inscrire au club de jeux des gardiens de la legende.</p> <br> 
              <p>Merci de cliquer sur le lien pour vérifier votre email auprés du club de jeu Les gardiens de la légende. </p> <br>
              <a href="${link}">cliquez ici pour vérifier votre email. </a> <br>` + emailfooterVerify,
        });

        console.log("Message sent: %s", info.messageId);
        // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        console.log(`Un email de vérification bien envoyé a ${userNowInDb.firstName} ${userNowInDb.lastName} via l'adresse email: ${userNowInDb.emailAddress} : ${info.response}`);
        // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

      }
      main().catch(console.error);

      // on renvoie un messge au FRONT !

      console.log("userNowInDb =>", userNowInDb)
      response.status(200).json({
        pseudo: userNowInDb.pseudo,
        firstName: userNowInDb.firstName,
        lastName: userNowInDb.lastName,
        message: "Merci de valider votre email en cliquant sur le lien envoyé avant de vous connecter."
      });


    } catch (error) {
      console.trace(
        'Erreur dans la méthode handleSignupForm du userController :',
        error);
      response.status(500).json(error.message);
    }
  },




  /**
   * Methode chargé d'aller mettre a jour les informations relatives à un utilisateur
   * @param {Express.Request} req - l'objet représentant la requête
   * @param {Express.Response} res - l'objet représentant la réponse
   *  * @param {req.params.id} req.params.id - le numéro identifiant un utilisateur précis
   */
  updateUser: async (req, res) => {


    try {
      //on vérifie si le user existe en BDD via à son ID
      const id = req.params.id;
      const userIdinDb = await User.findOne(id);

      // on extrait les infos du body //
      const {
        password,
        newPassword,
        newPasswordConfirm
      } = req.body;

      const firstName = req.sanitize(req.body.firstName);
      const lastName = req.sanitize(req.body.lastName);
      const pseudo = req.sanitize(req.body.pseudo);
      const avatar = req.sanitize(req.body.avatar);
      const emailAddress = req.sanitize(req.body.emailAddress);
      console.log("req.body dans updateUser => ", req.body);

      let userMessage = {};

      // on vérifit si l'utilisateur existe en BDD
      if (!userIdinDb.id === 'undefined' && userIdinDb.emailAddress === 'undefined') {
        console.log(`Cet utilisateur n'est pas enregistré en base de données`)

        return res.status(404).json(`Cet utilisateur n'est pas enregistré en base de données`);
      }
      //on vérifit que l'utiisateur a bien rentré son mot de passe pour changer un paramétre de son profil
      if (!password) {
        return res.status(403).json('Votre mot de passe est nécéssaire pour une mise a jour de votre profil')
      }
      // on vérifit que l'utilisateur est bien authentifié .
      if (await bcrypt.compare(password, userIdinDb.password)) {
        console.log("Votre mot de passe est valide.")
        userMessage.authentification = 'votre mot de passe est valide.';
      } else {
        console.log("Le mot de passe proposé pour changer le profil n'est pas valide !")
        return res.status(403).json(
          'L\'authentification a échoué, votre mot de passe n\'est pas valide !'
        )
      }
      //on check si le password et la vérif sont bien identiques
      if (newPassword !== newPasswordConfirm) {
        console.log("confirmation du nouveau mot de passe incorect")
        return res.json(
          'La confirmation du nouveau mot de passe est incorrecte'
        );
      }

      // on ne change que les paramètres envoyés mais on garde l'id a tous les coup.

      let updateUserInfo = {};

      updateUserInfo.id = userIdinDb.id;

      if (pseudo) {
        updateUserInfo.pseudo = pseudo;
        userMessage.pseudo = 'Votre pseudo a bien été enregistré';
      } else if (!pseudo) {
        updateUserInfo.pseudo = userIdinDb.pseudo
        userMessage.pseudo = 'Votre pseudo n\'a pas changé';
      }

      if (firstName) {
        updateUserInfo.firstName = firstName;
        userMessage.firstName = 'Votre prénom a bien été enregistré';
      } else if (!firstName) {
        updateUserInfo.firstName = userIdinDb.firstName
        userMessage.firstName = 'Votre prénom n\'a pas changé';
      }

      if (lastName) {
        updateUserInfo.lastName = lastName;
        userMessage.lastName = 'Votre nom a bien été enregistré';
      } else if (!lastName) {
        updateUserInfo.lastName = userIdinDb.lastName
        userMessage.lastName = 'Votre nom n\'a pas changé';
      }

      //! gestion de l'avatar avecune une banque d'image ?

      if (avatar) {
        updateUserInfo.avatar = avatar;
        userMessage.avatar = 'Votre avatar a bien été enregistré';
      } else if (!avatar) {
        updateUserInfo.avatar = userIdinDb.avatar
        userMessage.avatar = 'Votre avatar n\'a pas changé';
      }
      // on vérifit l'email
      if (emailAddress !== userIdinDb.emailAddress && validator.validate(emailAddress)) {
        updateUserInfo.emailAddress = emailAddress;
        console.log("Votre mail est modifié.");
        userMessage.emailAdress = 'Votre nouvel email a bien été enregistré'
      } else if (emailAddress === userIdinDb.emailAddress && validator.validate(emailAddress)) {
        console.log("Votre ancien mail est conservé.");
        updateUserInfo.emailAddress = userIdinDb.emailAddress;
        userMessage.emailAdress = 'Votre email est le même que precedemment';
      } else if (!emailAddress) {
        updateUserInfo.emailAddress = userIdinDb.emailAddress;
        userMessage.emailAdress = 'Votre email n\'a pas changé';
      } else if (emailAddress !== userIdinDb.emailAddress && !(validator.validate(emailAddress))) {
        updateUserInfo.emailAddress = userIdinDb.emailAddress;
        console.log("Le format de votre nouvel mail est incorect, votre ancien mail est conservé.");
        userMessage.emailAdress = 'Le format de votre nouvel email est incorect, votre ancien email est conservé.';
      }

      // on vérifit le password : si un nouveau est inséré, on le compare à la confirmation, on le hash et on le met dans l'objet.
      if (newPassword && newPassword !== userIdinDb.password && newPassword === newPasswordConfirm) {

        console.log("le changement du mot de passe est demandé. Un nouveau mot de passe valide a été proposé")

        const hashedPwd = await bcrypt.hash(newPassword, 10);
        console.log(newPassword, 'est devenu', hashedPwd);
        updateUserInfo.password = hashedPwd;

        userMessage.password = 'le changement du mot de passe est demandé. Un nouveau mot de passe valide a bien été enregistré';

      } else if (newPassword === password) {
        updateUserInfo.password = userIdinDb.password;
        console.log("Le nouveau mot de passe n'a pas grand chose de nouveau..");
        userMessage.password = 'Votre nouveau mot de passe est le même que precedemment';
      } else if (!newPassword) {
        console.log("l'ancien mot de passe est conservé.")
        updateUserInfo.password = userIdinDb.password;
        userMessage.password = 'Votre ancien mot de passe est conservé';
      }

      console.log('updateUserInfo => ', updateUserInfo);

      const newUser = new User(updateUserInfo);

      await newUser.update();

      //! on envois deux mails par sécurité en cas de changement d'adresse email dans le profil ! 
      //! ici envoie d'un mail sur sa nouvelle adresse pour confirmer le changemet d'information au user ! ----------------------------------

      // On est déja dans une fonction async mais si je ne redéfinit pas la portée j'ai pas les érreurs et console.log ! je dois utiliser un subterfuge !
      async function main() {

        //on généree un compte de service SMTP
        // je créer un objet "transporteur" réutilisable à l'aide du transport SMTP par défaut
        // (Pour tester sans créer d'email => https://mailtrap.io/ : config pour mailtrap dans mes notes !)
        //ici le test est avec une adresse mail test créer nodeMailer : lesgardiensdelalegende@gmail.com => code accés dans slack. On voit les messages envoyés via nodemailer dans les "messages envoyés" 
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL, // L'adresse mail qui va servir pour l'envoi, mais elle n'est pas visible par le destinataire ! Ces accés sont à coller dans le .env.back et sont présent sur le slack.
            pass: process.env.PASSWORD_EMAIL, // Le mot de passe qui va avec 
          },
        });

        // l'envoie d'email définit par l'object "transporter"
        const info = await transporter.sendMail({
          from: 'lesgardiensdelalegende@gmail.com', //l'envoyeur
          to: `${newUser.emailAddress}`, // le ou les receveurs => `${newUser.emailAddress}`
          subject: `Vos modification d'information sur le site des Gardiens de la légende à été pris en compte ! ✔`, // le sujet du mail
          text: `Bonjour ${newUser.firstName} ${newUser.lastName},`+emailTextUpdate, // l'envoie du message en format "plain text" ET HTML, permet plus de souplesse pour le receveur, tout le monde n'accepte pas le format html pour des raisons de sécurité sur ces boites mails, moi le premier ! 
          html: emailheaderVerify+`<h3>Bonjour <span class="username"> ${newUser.firstName} ${newUser.lastName}, </span> </h3> <br>`+emailfooterUpdate, // le contenu du mail en format html.
        });

        console.log("Message sent: %s", info.messageId);
        // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        console.log(`Email bien envoyé a ${newUser.firstName} ${newUser.lastName} via la nouvelle adresse email: ${newUser.emailAddress} : ${info.response}`);
        // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

      }
      main().catch("Erreur lors de l'envois du mail dans la méthode updateUser", console.error);

      //! fin du premier envoi d'email a la nouvelle adresse mail du user

      if (emailAddress !== userIdinDb.emailAddress && validator.validate(emailAddress)) {

        //! ici envoie d'un mail sur son ancienne adresse email pour confirmer le changemet d'information au user par sécurité ! ----------------------------------
        //! Un attaquant qui tenterais de changer un mail dans le profil aprés avoir dérobé le mot de passe du user serait démasqué et le user s'en rendrait compte sur sa boite mail.
        // On est déja dans une fonction async mais si je ne redéfinit pas la portée j'ai pas les érreurs et console.log ! je dois utiliser un subterfuge !
        async function main() {

          //on généree un compte de service SMTP
          // je créer un objet "transporteur" réutilisable à l'aide du transport SMTP par défaut
          // (Pour tester sans créer d'email => https://mailtrap.io/ : config pour mailtrap dans mes notes !)
          //ici le test est avec une adresse mail test créer nodeMailer : lesgardiensdelalegende@gmail.com => code accés dans slack. On voit les messages envoyés via nodemailer dans les "messages envoyés" 
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
              user: process.env.EMAIL, // L'adresse mail qui va servir pour l'envoi, mais elle n'est pas visible par le destinataire ! Ces accés sont à coller dans le .env.back et sont présent sur le slack.
              pass: process.env.PASSWORD_EMAIL, // Le mot de passe qui va avec 
            },
          });

          // l'envoie d'email définit par l'object "transporter"
          const info = await transporter.sendMail({
            from: 'lesgardiensdelalegende@gmail.com', //l'envoyeur
            to: `${userIdinDb.emailAddress}`, // ici le receveur est l'ancien mail donné par le user
            subject: `Vos modification d'information sur le site des Gardiens de la légende à été pris en compte ! ✔`, // le sujet du mail
            text: `Bonjour ${newUser.firstName} ${newUser.lastName},`+emailTextUpdateNewEmail, // l'envoie du message en format "plain text" ET HTML, permet plus de souplesse pour le receveur, tout le monde n'accepte pas le format html pour des raisons de sécurité sur ces boites mails, moi le premier ! 
            html: emailheaderVerify+`<h3>Bonjour <span class="username"> ${newUser.firstName} ${newUser.lastName}, </span> </h3> <br>`+emailFooterUpdateNewEmail, // le contenu du mail en format html.
          });

          console.log("Message sent: %s", info.messageId);
          // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
          console.log(`Email bien envoyé a ${newUser.firstName} ${newUser.lastName} via l'ancienne adresse email: ${userIdinDb.emailAddress} : ${info.response}`);
          // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

        }
        main().catch("Erreur lors de l'envois du mail dans la méthode updateUser", console.error);

      }

      console.log("le newUser in DB => ", newUser);

      if (emailAddress !== userIdinDb.emailAddress && validator.validate(emailAddress)) {
        userMessage.général = 'Vous avez changé votre email, par mesure de sécurité, une notification par email vous a été envoyé sur votre ancien et nouvel email, vous confirmant la mise a jour de votre profil. Votre précédent email a été supprimé de la base de donnée, vous ne recevrez plus d\'email de notre part sur cet email. Les changements précédent ont bien été enregistré.'
      } else {
        userMessage.général = 'Un email vous a été envoyé vous confirmant la mise a jour de votre profil. les changements précédent ont bien été enregistré.'
      }
      res.status(200).json(userMessage);

      console.log(`L'utilisateur avec l'id : ${newUser.id} et le pseudo ${newUser.pseudo}, a bien été modifié.`);

    } catch (error) {
      res.status(500).json(error.message);
      console.log("Erreur dans la modification d'un utilisateur : ", error);
    }
  },


  verifyEmail: async (req, res, err) => {
    try {

      const {
        userId,
        token
      } = req.query;
      console.log("userId =>", userId);
      console.log("secretCode =>", token)

      const userInDb = await User.findOne(userId);
      console.log("userInDb.emailverified =>", userInDb.verifyemail);


      const decodedToken = await jsonwebtoken.verify(token, jwtSecret, {
        audience: 'Lesgardiensdelalégende',
        issuer: `${userInDb.pseudo}`
      }, function (err, decoded) {

        if (err) {
          res.json("la validation de votre email a échoué", err)
        }

        return decoded
      });




      console.log("la valeur du decodeToken pour retrouver mon user.id => ", decodedToken);

      console.log("decode =>", decodedToken)
      console.log("userId =>", userId);

      if (userInDb.verifyemail) {
        console.log(`Le mail ${userInDb.emailAddress} à déja été authentifié avec succés !`);
        res.status(200).render('verifyEmail', {userInDb});


      } else if (!decodedToken.userId === userInDb.id && decodedToken.iss == userInDb.pseudo) {
        console.log(`une érreur est apparu =>`, err)
        //return res.status(401).json(`la validation de votre email a échoué`);
        return res.status(401).render('verifyEmailFail', {userInDb});;

      } else {

        await User.emailverified(userInDb.id);

        console.log(`Le mail ${userInDb.emailAddress} à été authentifié avec succés !`);
        res.status(200).render('verifyEmailWin', {userInDb});
        //res.status(200).json(`Bonjour ${userInDb.pseudo}, votre mail a été authentifié avec succés ! Vous pouvez désormais fermer cette page.`)
      }

    } catch (error) {
      console.trace(
        'Erreur dans la méthode verifyEmail du userController :',
        error);
      res.status(500).json(error.message);
    }

  },

  // si l'utilisateur a patienter trop longtmps pour valider son email, le token n'est valide que 24h. On doit lui fournir une autre possibilité de vérifié son email :


  resendEmailLink: async (req, res) => {

    try {

      const email = req.sanitize(req.body.email);

      console.log("email =>", email);
      //on ne recherche que l'email avec un format valide. Triple sécurité contre les tentatives d'injection de script (faille xss), Joi avec sa REGEX, express sanitize et email validator.
      if (!validator.validate(email)) {
        //le format de l'email est incorrect
        return res.json('Le format de l\'email est incorrect');
      }

      const userInDb = await User.findByEmail(email);

      if (typeof userInDb.id === "undefined") {
        console.log(`l'email ${email} n'existe pas en BDD !`);
        return res.status(404).json("cet email n'existe pas, assurez vous de l'avoir écris correctement.");
      }

      console.log("userInDb=>", userInDb);

      if (userInDb.verifyemail === true) {
        console.log(`${userInDb.pseudo} posséde déja un statut d'email vérifié, avec un statut ${userInDb.verifyemail}. `);
        return res.status(200).json(`Bonjour ${userInDb.pseudo}, votre email à déja été validé avec succés !`);
      }



      // on génére un new token aprés les vérif de base :


      const jwtOptions = {
        issuer: `${userInDb.pseudo}`,
        audience: 'Lesgardiensdelalégende',
        algorithm: 'HS512',
        expiresIn: '24h' // si l'utilisateur ne se réauthentifit pas dans les 24h, le token sera a nouveau invalide.
      };

      const jwtContent = {
        userId: `${userInDb.id}`,
        jti: userInDb.id + "_" + crypto.randomBytes(9).toString('base64')

      };

      const newToken = await jsonwebtoken.sign(jwtContent, jwtSecret, jwtOptions);

      async function main() {
        const host = req.get('host');
        const link = `https://${host}/v1/verifyEmail?userId=${userInDb.id}&token=${newToken}`;
        console.log("ici host vaut =>", host);
        console.log("ici link vaut => ", link);
        console.log("newToken => ", newToken);

        //le bout de code qui permet le transport de mon code 
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL, // L'adresse mail qui va servir pour l'envoi, mais elle n'est pas visible par le destinataire ! Ces accés sont à coller dans le .env.back et sont présent sur le slack.
            pass: process.env.PASSWORD_EMAIL, // Le mot de passe qui va avec 
          },
        });

        // l'envoie d'email définit par l'object "transporter"
        const info = await transporter.sendMail({
          from: 'lesgardiensdelalegende@gmail.com', //l'envoyeur
          to: `${userInDb.emailAddress}`, // le ou les receveurs => `${request.body.emailAddress}`
          subject: `Merci de confirmer votre email`, // le sujet du mail
          text: `Bonjour ${userInDb.firstName} ${userInDb.lastName}, merci de cliquer sur le lien pour vérifier votre email auprés du club de jeu Les gardiens de la légende. ${link}`, // l'envoie du message en format "plain text" ET HTML, permet plus de souplesse pour le receveur, tout le monde n'accepte pas le format html pour des raisons de sécurité sur ces boites mails, moi le premier ! 
          html: emailheaderVerify +`
            <h3>Bonjour <span class="username"> ${userInDb.firstName} ${userInDb.lastName}, </span> </h3> <br>
            <p>Vous souhaitez vous inscrire au club de jeux <h4> Les gardiens de la legende.</h4></p> <br> 
            <p>Merci de cliquer sur le lien pour vérifier votre email auprés du club de jeu Les gardiens de la légende. </p> <br>
            <a href="${link}">cliquez ici pour vérifier votre email. </a> <br>`+ emailfooterVerify,
        });

        console.log("Message sent: %s", info.messageId);
        // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        console.log(`Un email de vérification bien envoyé a ${userInDb.firstName} ${userInDb.lastName} via l'adresse email: ${userInDb.emailAddress} : ${info.response}`);
        // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

        // Quand l'utilisateur clique sur le lien, il est renvoyé sur la route verifyEmail ! 
      }
      main().catch("Erreur lors de l'envois du mail dans la méthode updateUser", console.error);

      res.json("Merci de cliquer sur le lien envoyé.");

    } catch (error) {
      console.trace(
        'Erreur dans la méthode resendEmailLink du userController :',
        error);
      res.status(500).json(error.message);
    }
  },

  /* new_pwdForm: (req, res) => {
    //on envoie le formulaire de connexion => vue ejs login temporaire ou voire avec Laura ?
    res.render('login');
  }, */

  new_pwd: async (req, res) => {

    try {

      const email = req.sanitize(req.body.emailAddress);

      console.log("email =>", email);
      //on ne recherche que l'email avec un format valide, on triple la sécu avec expressSanitizer en 1ere ligne, Joi en 2ieme ligne. Sachant qu e cet email est censé être déja en BDD.
      if (!validator.validate(email)) {
        //le format de l'email est incorrect
        return res.json('Le format de l\'email est incorrect');
      }

      const userInDb = await User.findByEmail(email);
      console.log("userInDb=>", userInDb);

      if (typeof userInDb.id === "undefined") {
        console.log(`l'email ${email} n'existe pas en BDD !`);
        res.status(404).json("cet email n'existe pas, assurez vous de l'avoir écris correctement.");
      }

      // Je construit un secret dynamique de déchiffrage du token !  => Pour rendre le lien unique est invalide a la seconde où l'utilisateur rentre un nouveau pssword, je prend son hash existant que je concaténe a sa date d'inscription pour en faire la clé secrete du token !
      // Ainsi lorsque l'utilisateur met à jour son mot de passe, nous remplacerons l'ancien hachage par le nouveau, et personne ne pourra plus accéder à la clé secrète qui aura disparu !!
      //Avec la combinaison du hachage du mot de passe de l'utilisateur et de la createdAtdate, le JWT devient un jeton à usage unique, car une fois que l'utilisateur a changé son mot de passe, les appels successifs à cette route généreront un nouveau hachage de mot de passe, et viendront ainsi invalider la clé secrète qui référence le mot de passe .

      // mais pourquoi doubler avec sa date d'inscription => cela permet de garantir que si le mot de passe de l'utilisateur était la cible d'une attaque précédente (sur un autre site web ou l'utilisateur a mis le même password), la date de création de l'utilisateur rendra la clé secrète unique à partir du mot de passe potentiellement divulgué. Même si l'attaquant a craké le code de notre utilisateur, comment pourra-t'il savoir la date, jusqu'a la seconde précise, de création du compte de notre l'utilisateur  ? Bon chance.... 😝 Sécurité XXL !! 

      const secret = `${userInDb.password}_${userInDb.inscription}`
      console.log("secret => ", secret);
      // on génére un new token aprés les vérif de base :

      const jwtOptions = {
        issuer: `${userInDb.pseudo}`,
        audience: 'envoiresetpwd',
        algorithm: 'HS512',
        expiresIn: '1h' // si l'utilisateur ne valide pas un new password dans l'heure, le token sera invalide.
      };

      const jwtContent = {
        userId: `${userInDb.id}`,
        jti: userInDb.id + "_" + crypto.randomBytes(9).toString('base64'),

      };

      const newToken = await jsonwebtoken.sign(jwtContent, secret, jwtOptions);
      console.log("newToken =>", newToken);


      async function main() {

        //on généree un compte de service SMTP
        // je créer un objet "transporteur" réutilisable à l'aide du transport SMTP par défaut
        // (Pour tester sans créer d'email => https://mailtrap.io/ : config pour mailtrap dans mes notes !)
        //ici le test est avec une adresse mail test créer nodeMailer : lesgardiensdelalegende@gmail.com => code accés dans slack. On voit les messages envoyés via nodemailer dans les "messages envoyés" 

        const host = req.get('host');

        const link = `http://${host}/v1/user/new_pwd?userId=${userInDb.id}&token=${newToken}`;
        console.log("ici link vaut => ", link);
        console.log("newToken => ", newToken);

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL, // L'adresse mail qui va servir pour l'envoi, mais elle n'est pas visible par le destinataire ! Ces accés sont à coller dans le .env.back et sont présent sur le slack.
            pass: process.env.PASSWORD_EMAIL, // Le mot de passe qui va avec 
          },
        });

        // l'envoie d'email définit par l'object "transporter"
        const info = await transporter.sendMail({
          from: 'lesgardiensdelalegende@gmail.com', //l'envoyeur
          to: `${userInDb.emailAddress}`, // le ou les receveurs => `${request.body.emailAddress}`
          subject: `Les gardiens de la légende : Changement de votre mot de passe`, // le sujet du mail
          text: `Bonjour ${userInDb.firstName} ${userInDb.lastName}, merci de cliquer sur le lien pour vérifier votre email auprés du club de jeu Les gardiens de la légende. ${link}`, // l'envoie du message en format "plain text" ET HTML, permet plus de souplesse pour le receveur, tout le monde n'accepte pas le format html pour des raisons de sécurité sur ces boites mails, moi le premier ! 
          html: emailheaderVerify+`<h3>Bonjour <span class="username"> ${userInDb.firstName} ${userInDb.lastName}, </span> </h3> <br>
              <p>Vous souhaitez réinitialiser votre mot de passe au club de jeux Les gardiens de la legende.</p> <br> 
              <p>Merci de cliquer sur le lien pour changer votre mot de passe. </p> <br>
              <a href="${link}">cliquez ici pour changer votre mot de passe. </a><br>`+emailfooterVerify,
        });

        console.log("Message sent: %s", info.messageId);
        // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        console.log(`Un email de vérification bien envoyé a ${userInDb.firstName} ${userInDb.lastName} via l'adresse email: ${userInDb.emailAddress} : ${info.response}`);
        // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

      }
      main().catch(console.error);


      res.json("Merci de consulter vos emails et de cliquer sur le lien envoyé pour renouveller votre mot de passe.");

    } catch (error) {

      console.trace(
        'Erreur dans la méthode resendEmailLink du userController :',
        error);
      res.status(500).json(error.message);
    }



  },

  reset_pwd: async (req, res, err) => {
    try {

      // je récupére des infos de la query (userId et token) et du body (newPassword, password)
      const {
        userId,
        token
      } = req.query;

      const pseudo = req.sanitize(req.body.pseudo);

      const {
        passwordConfirm,
        newPassword,
      } = req.body;

      // ETAPE 1 avant de d'insérer quoi que ce soit en BDD ou de verifier que les passwords soient identiques, je m'assure de l'identité de l'utilisateur en déchiffrant le token avec la clé dynamique crée dans la méthode new_pwd. 

      console.log("userId =>", userId);
      console.log("secretCode =>", token)


      const userInDb = await User.findOne(userId);

      const pseudoInDb = await User.findByPseudo(pseudo);

      // premiere vérif, je vérifis le pseudo dans le body et l'id dans la query, si une des deux n'existe pas ou pas égale au même utilisateur.. au revoir !
      if (typeof userInDb.id === 'undefined' || typeof pseudoInDb.pseudo === 'undefined' || userInDb.id !== pseudoInDb.id) {
        console.log("Bonjour, c'est gentil d'être passé mais votre identité n'a pas été reconnu 🤨")
        res.json("Bonjour, c'est gentil d'être passé mais votre identité n'a pas été reconnu 🤨 ")
      }


      // Je reconstitue ma clé secrete pour décoder le token.
      const secret = `${userInDb.password}_${userInDb.inscription}`


      const decodedToken = await jsonwebtoken.verify(token, secret, {
        audience: 'envoiresetpwd',
        issuer: `${userInDb.pseudo}`
      }, function (err, decoded) {

        if (err) {
          console.log("La validation de l'identité a échoué : le token émis ne correspond pas au token déchiffré !")
          res.json("La validation de votre identité pour renouveller votre mot de passe a échoué.", err)
        }
        return decoded
      });

      console.log("decodedToken =>", decodedToken);

      console.log("decodedToken.userId =>", decodedToken.userId);
      console.log("userInDb.id =>", userInDb.id);
      console.log("decodedToken.iss =>", decodedToken.iss);
      console.log("userInDb.pseudo =>", userInDb.pseudo);
      console.log("typeof decodedToken =>", typeof decodedToken);

      // Je double la sécurité ! Normalement si la méthode verify n'a pas pu décoder le token, il a déja été écarté !  
      // seulement 2 égals pour le 1er test car decodedToken.userId renvoie un nombre sous format STRING !
      if (!(decodedToken.userId == userInDb.id && decodedToken.iss == userInDb.pseudo) || typeof decodedToken === 'undefined') {
        console.log(`une érreur est apparu =>`, err)
        res.status(401).json(`la validation de votre identité a échoué`);

        //ETAPE 2 => check vérif password, hash, mise en BDD et renvoie message + info au Front !

      } else {

        //on check si le password et la vérif sont bien identiques
        if (newPassword !== passwordConfirm) {
          console.log("confirmation du nouveau mot de passe incorect")
          res.json('La confirmation du nouveau mot de passe est incorrecte');
        }

        console.log("La vérification des mots de passe a été passée avec succés")

        // On hash le mot de passe avant la mise en BDD :
        const password = await bcrypt.hash(newPassword, 10);
        console.log(newPassword, 'est devenu', password);

        const id = userInDb.id
        console.log("id =>", id);
        console.log("password => ", password);


        await User.updatePwd(password, id);

        // j'en profite pour rappeler a l'utilisateur de vérifier son email pour se connecter
        if (!userInDb.verifyemail) {
          console.log(`Le mail ${userInDb.emailAddress} n'as pas été authentifié, on rappel a l'utilisateur de s'autentifier à l'avenir !`);
          const message1 = `Bonjour ${userInDb.pseudo}, votre mot de passe a été modifié avec succés ! Neanmoins votre email n'a pas été authentifié, merci de vérifier votre email pour vous connecter.`;

          res.status(200).json({
            firstname: userInDb.firstName,
            lastname: userInDb.lastName,
            emailverified: userInDb.verifyemail,
            pseudo: userInDb.pseudo,
            message: message1,
          })

        } else {

          console.log(`Le passwod de ${userInDb.firstName} ${userInDb.lastName}  à été modifié avec succés !`);
          res.status(200).json({
            firstname: userInDb.firstName,
            lastname: userInDb.lastName,
            emailverified: userInDb.verifyemail,
            pseudo: userInDb.pseudo,
            message: `Bonjour ${userInDb.pseudo}, votre mot de passe a été modifié avec succés !`
          })
        }
        // ETAPE 3 :
        // ALLEZ, on est cool, on renvoit un petit mail a l'utilisateur pour lui confirmer le changement de mot de passe ! Histoire de bien flooder sa boite mail ! ça fait plaisir... 😁

        async function main() {

          //on génére un compte de service SMTP
          // je créer un objet "transporteur" réutilisable à l'aide du transport SMTP par défaut 
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
              user: process.env.EMAIL, // L'adresse mail qui va servir pour l'envoi, mais elle n'est pas visible par le destinataire ! Ces accés sont à coller dans le .env.back et sont présent sur le slack.
              pass: process.env.PASSWORD_EMAIL, // Le mot de passe qui va avec 
            },
          });

          // l'envoie d'email définit par l'object "transporter"
          const info = await transporter.sendMail({
            from: 'lesgardiensdelalegende@gmail.com', //l'envoyeur
            to: `${userInDb.emailAddress}`, // le ou les receveurs => `${newUser.emailAddress}`
            subject: `Vos modification d'information sur le site des Gardiens de la légende à été pris en compte ! ✔`, // le sujet du mail
            text: `Bonjour ${userInDb.firstName} ${userInDb.lastName},`+emailTextUpdateNewPassword, // l'envoie du message en format "plain text" ET HTML, permet plus de souplesse pour le receveur, tout le monde n'accepte pas le format html pour des raisons de sécurité sur ces boites mails, moi le premier ! 
            html: emailheaderVerify+`<h3>Bonjour <span class="username"> ${userInDb.firstName} ${userInDb.lastName}, </span> </h3> <br>`+emailFooterNewPassword, // le contenu du mail en format html.
          });

          console.log("Message sent: %s", info.messageId);
          // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
          console.log(`Email bien envoyé a ${userInDb.firstName} ${userInDb.lastName} via l'adresse email: ${userInDb.emailAddress} : ${info.response}`);
          // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

        }
        main().catch("Erreur lors de l'envois du mail dans la méthode updateUser", console.error);


      }

    } catch (error) {
      console.trace(
        'Erreur dans la méthode verifyEmail du userController :',
        error);
      res.status(500).json(error.message);
    }

  },


}

module.exports = userController;
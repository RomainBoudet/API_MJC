//mon fichier pour factoriser mes user emails !

module.exports = {
    emailheaderVerify: `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/meyer-reset/2.0/reset.min.css"
        integrity="sha512-NmLkDIU1C/C88wi324HBc+S2kLhi08PN5GDeUVVVC/BVt/9Izdsc9SVeVfA1UZbY3sHUlDSyRXhCzHfr6hmPPw=="
        crossorigin="anonymous" />
    <style>
    h3 {
      font-size: 1.5rem;
  }

  body {
      background-color: rgb(253, 232, 175);
  }

  .background {
      display: flex
  }

  .medieval {
      border-radius: 8px;
      max-height: 500px;
      height: 300px;
      width: 1500px;
      max-width: 100%;
  }
  .logo {
      border-radius: 8px;
      max-height: 300px;
      max-width: 300px;
      width: 2500px;
      height: 250px;
      padding: 1rem;
      position: absolute;
      left: 800px;
      top: 10px;
  }
  .montext {
      padding: 2rem 0 0 2rem;
  }
  a { 
    padding: 1rem 0 0 0;
    </style>
    <body>
        <div class="background">
    
            <a href="http://localhost:8080"> <img class="medieval"
                    src="https://eapi.pcloud.com/getpubthumb?code=XZlztkZqnIb2V9qFI4z3M5DI9gDBQIu0TfX&linkpassword=undefined&size=870x217&crop=0&type=auto"
                    alt="medieval"> </a>
    
            <div><a href="http://localhost:8080"> <img class="logo"
                        src="https://eapi.pcloud.com/getpubthumb?code=XZoUikZEo78U2gRx1yXF1P6sMJqSVwjXvt7&linkpassword=undefined&size=1024x937&crop=0&type=auto"
                        alt="logo les gardiens de la légendes"> </a></div>
        </div>
    
        <div class="montext"></div>`,
    emailfooterVerify: `<br> <p>L'administrateur du site Les gardiens de la légende.</p> <br>
        <a href="http://localhost:8080"> Les gardiens de la légendes</a> <br>

    </div>

</body>`,
    emailfooterUpdate: `<p>Vous êtes membre du club de jeux des gardiens de la legendes.</p>
    <p>Vous avez récemment changé vos informations personnelles dans la configuration de votre compte. 😊 </p>
    <p> Vos changement ont bien été pris en compte ! ✔️ </p> <br>
    
    <p>En vous remerciant et en espérant vous revoir bientôt autour d'un jeu ! 🤗</p>
    <p> Bonne journée.</p> <br>

    <p>L'administrateur du site Les gardiens de la légende.</p> <br>
    <a href="http://localhost:8080"> Les gardiens de la légendes</a>

</div>

</body>`,
    emailTextUpdate: `Vous êtes membre du club de jeux des gardiens de la legendes.
Vous avez récemment changé vos informations personnelles dans la configuration de votre compte. 😊 
Vos changement ont bien été pris en compte ! ✔️
En vous remerciant et en espérant vous revoir bientôt autour d'un jeu ! 🤗
Bonne journée.
L'administrateur du site Les gardiens de la légende.`,
    emailTextUpdateNewEmail: `Vous êtes membre du club de jeux des gardiens de la legendes.
Vous avez récemment changé vos informations personnelles dans la configuration de votre compte. 😊 
Vos changement ont bien été pris en compte ! ✔️
Vous avez changé d'adresse email, Ce sera le dernier email sur cette adresse.
Une notification vous a également été envoyé sur votre nouvel email.
En vous remerciant et en espérant vous revoir bientôt autour d'un jeu ! 🤗
Bonne journée.
L'administrateur du site Les gardiens de la légende.`,
    emailFooterUpdateNewEmail: `<p>Vous êtes membre du club de jeux des gardiens de la legendes.</p>
<p>Vous avez récemment changé vos informations personnelles dans la configuration de votre compte. 😊 </p>
<p> Vos changement ont bien été pris en compte ! ✔️ </p> <br>
<p>Vous avez changé d'adresse email, Ce sera le dernier email sur cette adresse.</p> <br>
<p>Une notification vous a également été envoyé sur votre nouvel email.</p> <br>
<p>En vous remerciant et en espérant vous revoir bientôt autour d'un jeu ! 🤗</p>
<p> Bonne journée.</p> <br>

<p>L'administrateur du site Les gardiens de la légende.</p> <br>
<a href="http://localhost:8080"> Les gardiens de la légendes</a>

</div>

</body>`,

    emailFooterNewPassword: `<p>Vous êtes membre du club de jeux des gardiens de la legendes.</p>
<p> Votre changement de mot de passe à bien été pris en compte ! ✔️ </p> <br>
<p>En vous remerciant et en espérant vous revoir bientôt autour d'un jeu ! 🤗</p>
<p> Bonne journée.</p> <br>

<p>L'administrateur du site Les gardiens de la légende.</p> <br>
<br> <a href="http://localhost:8080"> Les gardiens de la légendes</a>

</div>

</body>`,

    emailTextUpdateNewPassword: `Vous êtes membre du club de jeux des gardiens de la legendes.
Vous avez récemment changé vos informations personnelles dans la configuration de votre compte. 😊 
Vos changement ont bien été pris en compte ! ✔️
En vous remerciant et en espérant vous revoir bientôt autour d'un jeu ! 🤗
Bonne journée.
L'administrateur du site Les gardiens de la légende.`
};
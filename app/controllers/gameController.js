const Game = require('../models/game');
const { formatForGame } = require('../services/date');
const getPreview = require('../services/preview');

/**
 * Le controller chargé de centraliser les appels a la base de données concernant les jeux de sociétés
 */
const gameController = {
  /**
   * Méthode chargé d'aller chercher les informations relatives à tous les jeux
   * @param {Express.Response} res - l'objet représentant la réponse
   * @return {Object}  - Les jeux sous forme d'objet JSON
   */
  allGames: async (_, res) => {
    try {
      const games = await Game.findAll();
      const gamesFormat = games.map(game => {
        game.purchasedDate = formatForGame(game.purchasedDate);
        return game;
      });
      getPreview(gamesFormat);
      //console.log(gamesFormat);
      res.json(gamesFormat);
    } catch (error) {
      console.log(error.message);
      res.status(404).json(error.message);
    }
  },
  /**
   * Méthode chargé d'aller chercher les informations relatives à un jeux
   * @property {int} id - l'id du jeu cherché
   * @param {Express.Request} req - l'objet représentant la requête
   * @param {Express.Response} res - l'objet représentant la réponse
   * @return {Object}  - Le jeu objet sous forme d'objet JSON
   */
  oneGame: async (req, res) => {
    try {
      const {
        id
      } = req.params;
      const game = await Game.findOne(id);
      game.purchasedDate = formatForGame(game.purchasedDate);
      //console.log(game);
      res.json(game);
    } catch (error) {
      console.log(error.message);
      res.status(404).json(error.message);
    }
  },
  /**
   * Une méthode qui prend en charge la création d'un nouveau jeu dans la BDD
   * @name newGame
   * @property {string} title - le titre du jeu
   * @property {int} minPlayer - le nombre minimum de joueur nécessaire pour jouer au jeu
   * @property {int} maxPlayer - le nombre maximum de joueur pour jouer au jeu
   * @property {int} minAge - l'âge minimum pour pouvoir jouer au jeu
   * @property {int||object} duration - la durée moyenne d'une partie
   * @property {int} quantity - le nombre d'exemplaire du jeu que nous possédons
   * @property {string} creator - le nom du créateur du jeu
   * @property {string} editor - le nom de l'éditeur du jeu
   * @property {string} description - la description du jeu
   * @property {int} year - l'année de sortie du jeu
   * @property {int} typeId - l'id du type (jeu de base ou DLC) du jeu
   * @property {string||array} gameCategories - les catégories du jeu
   * @param {Express.Request} request - l'objet représentant la requête
   * @param {Express.Response} response - l'objet représentant la réponse
   * @return {Object}  - Le nouveau jeu sous forme d'objet JSON
   */
  newGame: async (req, res) => {
    try {

      //on se protége des failles xss via express sanitizer
      const data = {};
      data.title = req.sanitize(req.body.title);
      data.minPlayer = req.sanitize(req.body.minPlayer);
      data.maxPlayer = req.sanitize(req.body.maxPlayer);
      data.minAge = req.sanitize(req.body.minAge);
      data.duration = req.sanitize(req.body.duration);
      data.quantity = req.sanitize(req.body.quantity);
      data.creator = req.sanitize(req.body.creator);
      data.editor = req.sanitize(req.body.editor);
      data.description = req.sanitize(req.body.description);
      data.year = req.sanitize(req.body.year);
      data.typeId = req.sanitize(req.body.typeId);
      data.gameCategories = req.sanitize(req.body.gameCategories);

      if (typeof data.duration === "object") {
        // on calcule afin de retouver le format entier en minutes
        data.duration = 60 * data.duration.hours + data.duration.minutes;
      }

      const newGame = new Game(data);
      await newGame.save();
      res.json(newGame);
    } catch (error) {
      console.log(`Erreur lors de l'enregistrement du jeu: ${error.message}`);
      res.status(500).json(error.message);
    }
  },
  /**
   * Une méthode qui prend en charge la mise à jour d'un jeu dans la BDD
   * @name updateGame
   * @property {int} id - l'id du jeu cherché
   * @property {string} title - le titre du jeu
   * @property {int} minPlayer - le nombre minimum de joueur nécessaire pour jouer au jeu
   * @property {int} maxPlayer - le nombre maximum de joueur pour jouer au jeu
   * @property {int} minAge - l'âge minimum pour pouvoir jouer au jeu
   * @property {int||object} duration - la durée moyenne d'une partie
   * @property {int} quantity - le nombre d'exemplaire du jeu que nous possédons
   * @property {string} creator - le nom du créateur du jeu
   * @property {string} editor - le nom de l'éditeur du jeu
   * @property {string} description - la description du jeu
   * @property {int} year - l'année de sortie du jeu
   * @property {int} typeId - l'id du type (jeu de base ou DLC) du jeu
   * @property {string||array} gameCategories - les catégories du jeu
   * @param {Express.Request} request - l'objet représentant la requête
   * @param {Express.Response} response - l'objet représentant la réponse
   * @return {Object}  - Le jeu mis à jour sous forme d'objet JSON
   */
  updateGame: async (req, res) => {
    try {
      const {
        id
      } = req.params;
      const game = await Game.findOne(id);
      
      //on se protége des failles xss via express sanitizer
      title = req.sanitize(req.body.title);
      minPlayer = req.sanitize(req.body.minPlayer);
      maxPlayer = req.sanitize(req.body.maxPlayer);
      minAge = req.sanitize(req.body.minAge);
      duration = req.sanitize(req.body.duration);
      quantity = req.sanitize(req.body.quantity);
      creator = req.sanitize(req.body.creator);
      editor = req.sanitize(req.body.editor);
      description = req.sanitize(req.body.description);
      year = req.sanitize(req.body.year);
      typeId = req.sanitize(req.body.typeId);
      gameCategories = req.sanitize(req.body.gameCategories);

      if (typeof duration === "object") {
        // on calcule afin de retouver le format entier en minutes
        duration = 60 * duration.hours + duration.minutes + ' minutes';
      }

      if (title) {
        game.title = title;
      }

      if (minPlayer) {
        game.minPlayer = minPlayer;
      }

      if (maxPlayer) {
        game.maxPlayer = maxPlayer;
      }

      if (minAge) {
        game.minAge = minAge;
      }

      if (duration) {
        game.duration = duration;
      }

      if (quantity) {
        game.quantity = quantity;
      }

      if (creator) {
        game.creator = creator;
      }

      if (editor) {
        game.editor = editor;
      }

      if (description) {
        game.description = description;
      }

      if (year) {
        game.year = year;
      }

      if (typeId) {
        game.typeId = typeId;
      }

      if (gameCategories) {
        game.gameCategories = gameCategories;
      }

      await game.update();
      res.json(game);
    } catch (error) {
      console.log(`Erreur lors de la mise à jour du jeu: ${error.message}`);
      res.status(500).json(error.message)
    }
  },

  deleteGame: async (req, res) => {
    try {
      const {
        id
      } = req.params;
      const game = await Game.findOne(id);
      await game.delete();
      res.json(`Le jeu avec l'${id} a été supprimé`);
    } catch (error) {
      console.log(`Erreur lors de la suppresion du jeu: ${error.message}`);
      res.status(500).json(error.message)
    }
  }
};

module.exports = gameController;
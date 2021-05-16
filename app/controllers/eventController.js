const Event = require('../models/event');
const { formatForArticle, formatForBack } = require('../services/date');
/**
 * Le controller chargé de centraliser les appels a la base de données concernant les évenements
 */
const eventController = {
  /**
     * Méthode chargé d'aller chercher les informations relatives à tous les évenements
     * @param {Express.Response} res - l'objet représentant la réponse
     * @return {Object}  - Les évènements sous forme d'objet JSON
     */
  allEvent: async (_, res) => {
    try {
      const events = await Event.findAll();
      //console.log(events);
      const eventsFormat = events.map(event => {
        event.eventDate = formatForArticle(event.eventDate);
        event.createdDate = formatForArticle(event.createdDate);
        if (event.updateDate) {
          event.updateDate = formatForArticle(event.eventDate);
        }
        return event;
      });
      //console.log(eventsFormat);
      res.json(eventsFormat);
    } catch (error) {
      console.log(error.message);
      res.status(404).json(error.message);
    }
  },
  /**
  * Méthode chargé d'aller chercher les informations relatives à un évenement
  * @property {int} id - l'id de l'évènement cherché
  * @param {Express.Request} req - l'objet représentant la requête
  * @param {Express.Response} res - l'objet représentant la réponse
  * @return {Object}  - L'évènement sous forme d'objet JSON
  */
  oneEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findOne(id);
      event.eventDate = formatForArticle(event.eventDate);
      event.createdDate = formatForArticle(event.createdDate);
      if (event.updateDate) {
        event.updateDate = formatForArticle(event.eventDate);
      }

      //console.log(event);
      res.json(event);
    } catch (error) {
      console.log(error.message);
      res.status(404).json(error.message);
    }
  },
  /**
  * Une méthode qui prend en charge la création d'un nouvel évènement dans la BDD
  * @name newEvent
  * @property {string} title - le titre qu'un évènement doit avoir
  * @property {string} description - la description de l'évènement, celui-ci est obligatioire et doit avoir au minimum 15 caractères
  * @property {date} eventDate - la date à laquelle l'évènement aura lieu
  * @property {int} creatorId - l'id du créateur de l'évènement
  * @property {int} tagId - l'id de la catégorie à laquelle appartient l'évènement
  * @property {string||array} eventGames - les noms des jeux associées à l'événement
  * @param {Express.Request} request - l'objet représentant la requête
  * @param {Express.Response} response - l'objet représentant la réponse
  * @return {Object}  - Le nouvel évènement sous forme d'objet JSON
  */

  newEvent: async (req, res) => {
  console.log("req.body dans eventController newEvent methode ==>>",req.body);
    try {
    //on se protége des failles xss via express sanitizer 
    const data = {};
    data.title = req.sanitize(req.body.title);
    data.description = req.sanitize(req.body.description);
    data.eventDate = req.sanitize(req.body.eventDate);
    data.tagId = req.sanitize(req.body.tagId);
    data.creatorId = req.sanitize(req.body.creatorId);

      const newEvent = new Event(data);
      await newEvent.save();
      res.json(newEvent);
    } catch (error) {
      console.log(`Erreur lors de l'enregistrement de l'évènement: ${error.message}`);
      res.status(500).json(error.message);
    }
  },
  /**
  * Une méthode qui prend en charge la mise à jour d'un article dans la BDD
  * @name updateEvent
  * @property {int} id - l'id de l'évènement cherché
  * @property {string} title - le titre qu'un évènement doit avoir
  * @property {string} description - la description de l'évènement, celui-ci est obligatioire et doit avoir au minimum 15 caractères
  * @property {date} eventDate - la date à laquelle l'évènement aura lieu
  * @property {int} creatorId - l'id du créateur de l'évènement
  * @property {int} tagId - l'id de la catégorie à laquelle appartient l'évènement
  * @property {string||array} eventGames - les noms des jeux associées à l'événement
  * @param {Express.Request} request - l'objet représentant la requête
  * @param {Express.Response} response - l'objet représentant la réponse
  * @return {Object}  - L'évènement mis à jour sous forme d'objet JSON
  */
  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const newData = req.body;
      const event = await Event.findOne(id);

    //on se protége des failles xss via express sanitizer
    title = req.sanitize(req.body.title);
    description = req.sanitize(req.body.description);
    eventDate = req.sanitize(req.body.eventDate);
    tagId = req.sanitize(req.body.tagId);
    data.creatorId = req.sanitize(req.body.creatorId);


      if (title) {
        event.title = title;
      }

      if (description) {
        event.description = description;
      }

      if (eventDate) {
        event.eventDate = eventDate;
      }

      if (tagId) {
        event.tagId = tagId;
      }

      if (eventGames) {
        event.eventGames = eventGames;
      }

      await event.update();
      res.json(event);
    } catch (error) {
      console.log(`Erreur lors de la mise à jour de l'évènement: ${error.message}`);
      res.status(500).json(error.message);
    }
  },
  /**
  * Méthode chargé d'aller supprimer un évenement
  * @property {int} id - l'id de l'évènement cherché
  * @param {Express.Request} req - l'objet représentant la requête
  * @param {Express.Response} res - l'objet représentant la réponse
  * @return {String}  - Une string en JSON confirmant la suppression
  */
  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findOne(id);

      await event.delete();
      res.json(`L'évènement avec l'${id} a été supprimé`);
    } catch (error) {
      console.log(`Erreur lors de la suppression de l'évènement: ${error.message}`);
      res.status(500).json(error.message);
    }
  }
};

module.exports = eventController;

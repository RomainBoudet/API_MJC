// doc JOI => https://joi.dev/api/?v=17.4.0

const Joi = require('joi');

const tokenSchema = Joi.object({
    token: Joi.string()
        .pattern(new RegExp(/^[A-Za-z0-9]{20,}$/))
        .required()
        .messages({
            'string.empty': `L'URL doit contenir un token pour être valide!`,
            'string.pattern.base':'Votre format de token est incorrect !',
        }),

});

module.exports = tokenSchema;
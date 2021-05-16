const sanitizeInput = require('sanitizer');

/**
 * sanitizer Middleware
 * @module middleware/sanitizer
 */
const sanitizer =  (req, res, next) => {

    try {

        //On boucle sur chaque propriétées du body et sur chaque propriétées de query et on remplace tous ca par leur version sanitizé ! 
        //pour rappel : sanitizer.escape() => ça échappe tandis que : sanitizer.sanitize() ça la vire direct...
        console.log("on passe");

        for (let prop in req.body) {
            req.body[prop] = sanitizeInput.sanitize(req.body[prop]);

            //let sanitBodyInput = sanitizeInput.sanitize(req.body[prop]);

            console.log("sanitBodyInput => ", sanitBodyInput);
            console.log("req.body => ", req.body);

            /* if (sanitBodyInput !== req.body[prop]) {

                res.status(401).json(`Don't even try... we know you with you're IP `);
                return;
            } */
        }

        next();

    } catch (err) {

        return res.status(500).json({
            message: 'Erreur lors de l\'opération de sanitizer'
        });

    }
}

module.exports = sanitizer;

//https://www.npmjs.com/package/sanitizer
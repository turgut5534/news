const hbs = require('hbs')
const path = require('path')

const partialsDirectory = path.join(__dirname, '../../templates/views/partials')
hbs.registerPartials(partialsDirectory)

hbs.registerHelper('compare', function(a, b) {
    if (a === b) {
      return true;
    } else {
      return false;
    }
  });

module.exports = hbs
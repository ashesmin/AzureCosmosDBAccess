
/*
 * GET home page.
 */

module.exports = function(app){
  app.get('/', function(req, res) {
  	res.render('nodeMCU.html');
  });
  app.get('/error', function(req, res) {
  	res.render('error.html');
  });
  app.get('/nodeMCU', function(req, res) {
  	res.render('nodeMCU.html');
  });
};
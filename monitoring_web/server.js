var express = require('express'),
    http = require('http'),
    path = require('path'),
    fs = require('fs');

var app = express();
var router = require('./routes/main')(app);


var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

const config = require("./config");
const CosmosClient = require("@azure/cosmos").CosmosClient;
const { endpoint, key, databaseId, containerId } = config;

const client = new CosmosClient({ endpoint, key });

const database = client.database(databaseId);
const container = database.container(containerId);

app.get('/latest', async function(request, response) {
    const querySpec = {
        query: "SELECT * from root r WHERE r.id = 'NodeMCU'"
        // query: "SELECT * from root r"
    };
    const { resources: items } = await container.items
          .query(querySpec)
          .fetchAll();

    response.send(items);
});

http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
    console.log('Express server listening on port ' + app.get('port'));
});
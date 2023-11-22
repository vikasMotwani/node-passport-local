const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const monk = require('monk');
const router = require('./index');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/', router);

const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server started at 3000');
});
const express = require('express');
const xmlparser = require('express-xml-bodyparser');
const connectDB = require('./config/db');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
// Connect Database
connectDB();
//Set default content type

function defaultContentTypeMiddleware(req, res, next) {
  req.headers['content-type'] = req.headers['content-type'] || 'text/xml';
  next();
}
app.use(defaultContentTypeMiddleware);

app.use(bodyParser({ limit: '50mb' }));

app.use(express.json({ extended: false }));

app.use(express.urlencoded({ extended: false }));

var options = {
  type: ['text/xml', 'application/xml']
};
app.use(bodyParser.text(options));

//Define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/transcripts', require('./routes/api/transcripts'));
app.use('/api/auth', require('./routes/api/auth'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  //set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}
const PORT = process.env.PORT || 5000;
// const PORT = 80;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

const connectToMongo = require('./db');
var cors = require('cors')
connectToMongo();   // middleware express incoming request  
const express = require('express');
require('dotenv').config();

const app = express()

// const port = 5000;
const port = process.env.PORT || 5000; 

app.use(cors())
app.use(express.json())



// const app = express();

// Available routes 
app.use('/api/auth', require('./routes/auth'))
app.use('/api/notes', require('./routes/notes'))

app.get('/', (req, res) => {
  res.send('Hello World from iNotebook backend!');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`iNotebook backend running on port ${PORT}`);
});
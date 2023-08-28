const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors')
const app = express();
const PORT = process.env.PORT || 8082;
require('dotenv').config();

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

// const config = {
//   connectionString:
//     "postgres://paysystemdb_user:NImIQdhh8I8sWXJb79Z24uQTI5oJQqUD@dpg-cir0bbdiuie930j5d8lg-a.singapore-postgres.render.com/paysystemdb?ssl=true",
// };

// const { Client } = require('pg');
// const client = new Client(config);
// client.connect();

app.use(cors({ origin: true, credentials: true }))
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false, parameterLimit:50000 }));

app.get('/', async (req, res) => {
    res.status(200).send("OK");
})


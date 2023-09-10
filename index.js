const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors')
const app = express();
const PORT = process.env.PORT || 8082;
require('dotenv').config();

// app.listen(PORT, () => {
//   console.log(`listening on ${PORT}`);
// });

// app.use(cors({ origin: true, credentials: true }))
// app.use(bodyParser.json({limit: '50mb'}));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: false, parameterLimit:50000 }));

// app.get('/', async (req, res) => {
//     res.status(200).send("OK");
// })

const config = {
  connectionString:
    "postgres://gameportal_db_user:TnJdfCS9gNV1j1P19fsGp2H14t6qkf1N@dpg-cjrcte61208c73bkhro0-a.singapore-postgres.render.com/gameportal_db?ssl=true",
};

const { Client } = require('pg');
const client = new Client(config);
client.connect();

var uuid = require('uuid-random');
var allClient = [];

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port:PORT }, () => {
  console.log('server started')
})

wss.on('connection', function connection(client){

  client.on('close', () => {  
    for(var i = 0; i < allClient.length; i++)
    {              
        if (allClient[i].id === client.id)
        { 
            allClient.splice(i, 1);
            break;
        }
    }
  })

  client.on('message', (data) => {
    var dataJSON = JSON.parse(data);

    switch(dataJSON.type)
    {
      case "PlayerLogin":
          PlayerLogin(client, dataJSON.data);
          break;
      case "PlayerBet":
          PlayerBet(dataJSON.sender, dataJSON.matchId, dataJson.amount);
          break;

      case "PlayerCollect":
          PlayerCollect(dataJSON.sender, dataJSON.matchId);
          break;

      case "PlayerFailCollect":
        PlayerFailCollect(dataJSON.sender, dataJSON.matchId);
          break;
    }
  });
});

function CreateMatch()
{
  var rate = Math.floor(Math.random() * 10000) + 100;

  client.query("INSERT INTO rocket_matches (rate, created_on) VALUES ("+rate+", NOW())")
        .then((result) => {
          
          for(var i = 0; i < allClient.length; i++)
          {
            var clientData = `{
              "type": "StartMatch",
              "sender": "Server",
              "matchId": "${matchId}",
              "rate": "${rate}"
            }`;
          
            allClient[i].send(clientData);
          }

          setInterval(function(){ 
            CreateMatch();
          }, 5000 + (rate * 100));
        });
}

CreateMatch();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function PlayerBet(sender, matchId, amount)
{
  client.query("INSERT INTO rocket_bet_history (uid, match_id, amount, timestamp) VALUES ("+sender+", "+matchId+", "+amount+", NOW())");
}

function PlayerCollect(sender, matchId)
{
  var currentTimeStamp = Math.floor(Date.now() / 1000);

  client.query("SELECT * FROM rocket_matches WHERE id = "+matchId)
        .then((result) => {

          var matchTimestamp = result.rows[0].created_on;
          
          client.query("SELECT * FROM rocket_bet_history WHERE uid = "+sender+" AND match_id = "+matchId)
                .then((result2) => {
                  
                  var betAmount = result2.rows[0].amount;
                  var winAmount = (currentTimeStamp - matchTimestamp - 5) * betAmount * 0.1;
                  
                  client.query("UPDATE rocket_bet_history SET result = "+winAmount);
                });
        });
}

function PlayerFailCollect(sender, matchId)
{
  client.query("SELECT * FROM rocket_bet_history WHERE uid = "+sender+" AND match_id = "+matchId)
        .then((result) => {
    
          var betAmount = result.rows[0].amount;
          
          client.query("UPDATE rocket_bet_history SET result = "+ (-betAmount));
        });
}

function PlayerLogin(client, uid)
{
  client.id = uid;

  allClient.push(client);
  console.log("Player ID:"+uid);
}
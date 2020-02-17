// Tutorial: https://stackabuse.com/reading-and-writing-json-files-with-node-js/

// Holen von der DB
const mariadb = require('mariadb');
const pool = mariadb.createPool({host: "localhost", user: "admin2", password: "1234", connectionLimit: 5, database: "mphirschmann"});

const fs = require('fs');

// -------------------------------------------------------------------------------------------------------

// Für die Connection auf die DB -- GET ALL
async function getallAsyncFunction(wtable) {
  let conn;
  try {
    conn = await pool.getConnection();
    if(wtable != null){
      const rows = await conn.query("SELECT * FROM " + wtable + ";");
      return rows;
    }
    else{
      console.log("An error occured, while trying to get all.")
    }
  } catch (err) {
    throw err;
  } finally {
    if (conn) conn.release(); //release to pool
  }
}

// -------------------------------------------------------------------------------------------------------

// Ausgabe im Browser
const express = require('express');
const app = express();
const port = 4000;
const cors = require('cors');

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));
app.use((req,res,next) => {
  // CORS, damit keine Violation auftritt
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header("Access-Control-Allow-Methods", "GET");
  next();
});

// -------------------------------------------------------------------------------------------------------

// GET all Touren
let data;

app.get('/tours', cors(), (req, res) => {
  getallAsyncFunction("TOUR").then(function(val){ // ruft die funktion auf und wenn fertig (then), dann wird die funktion mit den return wert von der funktion gemacht und der wert mit val ausgegeben
    res.json(val);
    data = JSON.stringify(val, null, 2);
      
    // fs.writeFileSync('route.json', data);
    fs.writeFile('route.json', data, (err)=>{
      if (err) throw err;
      console.log("Data written to file");
    });
  });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
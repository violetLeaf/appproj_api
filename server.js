// Tutorial: https://stackabuse.com/reading-and-writing-json-files-with-node-js/

// Holen von der DB
const mariadb = require('mariadb');
const pool = mariadb.createPool({host: "localhost", user: "admin2", password: "1234", connectionLimit: 5, database: "mphirschmann"});

const fs = require('fs');
const del = require('del');

// -------------------------------------------------------------------------------------------------------

// Für die Connection auf die DB -- GET ALL
async function getallAsyncFunction() {
  let conn;
  let rows;
  
  try {
    conn = await pool.getConnection();
    if(arguments[0] == "TOUR"){
      rows = await conn.query("SELECT * FROM " + arguments[0] + ";");
    }

    else if (arguments[0] == "TOUReinzeln"){
      rows = await conn.query("SELECT * FROM TOUR WHERE id = " + arguments[1] + ";");
    }

    else if (arguments[0] == "TOURinformationen"){
      rows = await conn.query("SELECT * FROM `tour_has_station` JOIN media ON media_id = media.id LEFT JOIN text ON media.text_id = text.id LEFT " +
      "JOIN file ON media.file_id = file.id JOIN station ON tour_has_station.station_id = station.id JOIN area ON station.area_id = area.id " +
      "WHERE `tour_id`= " + arguments[1] + " ORDER BY ordernumber");
    }

    else if (arguments[0] == "AREA"){
      rows = await conn.query("SELECT DISTINCT area.* FROM `tour_has_station` " + 
      "JOIN station ON station.id = station_id " +
      "JOIN area ON area.id = station.area_id " +
      "WHERE tour_id=" + arguments[1] + ";");
    }

    else if (arguments[0] == "STATION"){
      rows = await conn.query("SELECT * `station` FROM  WHERE area_id=" + arguments[1] + ";");
    }

    else{
      console.log("An error occured, while trying to get all.");
      rows = null;
    }

    return rows;
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
  });
});

app.get('/tour/:id', cors(), (req, res) => {
  getallAsyncFunction("TOUReinzeln", req.params.id).then(function(val){
    let result = {
      "id": val[0].id,
      "title": val[0].title,
      "reversible": val[0].reversible,
      "template_id": val[0].template_id,
      "guide": val[0].guide,
      "date": val[0].date
    };

    getallAsyncFunction("AREA", val[0].id).then(function(val_area){ 
      result.areas = []

      val_area.forEach(function(item) {
        let area = {
          "id": item.id,
          "title": item.title,
          "position": item.position
        };
        
        result.areas.push(area);
      });
      
      // in progress
      getallAsyncFunction("STATION", val_area.id).then(function(val_station){
        result.areas.stations = []

        val_station.forEach(function(i){
          let station = {
            "id": i.id,
            "name": i.name
          };

          result.areas.stations.push(station);
        });

        
        res.json(result);
        data = JSON.stringify(val, null, 2);
        console.log(req.params.id);
      });
  
      // (() => {
      //   const deletedPaths = del(['tour/**', '!tour']);
      //   console.log('Deleted files and directories:\n', deletedPaths.join('\n'));
      // })();
      // fs.mkdirSync('tour');
      // fs.mkdirSync('tour/media');
        
      // fs.writeFileSync('route.json', data);
      // fs.writeFile('tour/route.json', data, (err)=>{
      //   if (err) throw err;
      //   console.log("Data written to file.");
      // });
    });
  });
  
});

app.get('/download/:filename', function(req, res){
  const file = `${__dirname}/tour/` + req.params.filename;
  console.log(file);
  res.download(file); // Set disposition and send it.
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
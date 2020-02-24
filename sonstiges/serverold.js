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
      // noch überarbeiten!
      rows = await conn.query("SELECT * FROM `station` WHERE area_id=" + arguments[1] + ";");
    }

    // else if (arguments[0] == "MEDIA"){
    //   // noch überarbeiten!
    //   rows = await conn.query("SELECT * FROM `media` LEFT JOIN text ON media.text_id=text.id LEFT JOIN file ON media.file_id=file.id " +
    //   "WHERE station_id=" + arguments[1] + ";");
    // }

    else if (arguments[0] == "STATIONTOUR"){
      // noch überarbeiten!
      rows = await conn.query("SELECT DISTINCT station.* FROM tour_has_station JOIN station ON station.id = tour_has_station.station_id WHERE tour_id=" + arguments[1] + " AND  area_id=" + arguments[2] + ";");
    }

    else if (arguments[0] == "MEDIATOUR"){
      // noch überarbeiten!
      rows = await conn.query("SELECT *, text.id AS textId, file.id AS fileId FROM tour_has_station JOIN media ON tour_has_station.media_id = media.id "+
          "LEFT JOIN text ON media.text_id=text.id LEFT JOIN file ON media.file_id=file.id " +
          "WHERE tour_id=" + arguments[1] + " AND tour_has_station.station_id=" + arguments[2] + ";");
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

  return new Promise(resolve => {
    resolve(rows);
  });
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
      result.areas = [];

      val_area.forEach(e => {
        let area = {
          "id": e.id,
          "title": e.title,
          "position": e.position
        };

        result.areas.push(area);

        getallAsyncFunction("STATION", area.id).then(function(val_station){
          // area.stations = [];
          result.areas.stations = [];

          val_station.forEach(el => {
            let station = {
              "id": el.id,
              "name": el.name
            };

            // area.stations.push(station);
            result.areas.stations.push(station);

            getallAsyncFunction("MEDIA", station.id).then(function(val_media){
              // station.medias = [];
              result.areas.stations.medias = [];
    
              val_media.forEach(ele => {
                let media = null;
                
                if(ele.text_id != null){
                  media = {
                    "id": ele.id,
                    "type": "text",
                    "caption": ele.caption,
                    "text": ele.text
                  };
                }
                else if(ele.file_id != null){
                  media = {
                    "id": val_media[k].id,
                    "type": "file",
                    "caption": val_media[k].caption,
                    "url": val_media[k].destinationurl
                  };
                }
    
                // station.medias.push(media);
                result.areas.stations.medias.push(media);
                console.log(result);
              });
            });
          });
        });
      });

      res.json(result);
      data = JSON.stringify(result, null, 2);

      // for(var i = 0; i < val_area.length; i++){
      //   let area = {
      //     "id": val_area[i].id,
      //     "title": val_area[i].title,
      //     "position": val_area[i].position
      //   };
        
      //   result.areas.push(area);

      //   getallAsyncFunction("STATION", area.id).then(function(val_station){
      //     result.areas[i].stations = [];

      //     for(var j = 0; j < val_station.length; j++){
      //       let station = {
      //         "id": val_station[j].id,
      //         "name": val_station[j].name
      //       };

      //       result.areas[i].stations.push(station);

      //       getallAsyncFunction("MEDIA", station.id).then(function(val_media){
      //         result.areas[i].stations[j].medias = [];
    
      //         for(var k = 0; k < val_media.length; k++){
      //           let media = null;
      //           // if(val_media.text_id != null){
      //             media = {
      //               "id": val_media[k].id,
      //               "type": "text",
      //               "caption": val_media[k].caption,
      //               "text": val_media[k].text
      //             };
      //           // }
      //           // else if(val_media[k].file_id != null){
      //           //   media = {
      //           //     "id": val_media[k].id,
      //           //     "type": "file",
      //           //     "caption": val_media[k].caption,
      //           //     "url": val_media[k].destinationurl
      //           //   };
      //           // }
    
      //           result.areas[i].stations[j].medias.push(media);
      //         };
      //       });
      //     };
      //   });
      // }

  
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
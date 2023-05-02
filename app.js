const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
let db = null;
const app = express();
app.use(express.json());

const convertState = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

const convertDistrict = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};
const convertStats = (obj) => {
  return {
    totalCases: obj.cases,
    totalCured: obj.cured,
    totalActive: obj.active,
    totalDeaths: obj.deaths,
  };
};
const dbPath = path.join(__dirname, "covid19India.db");

const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initialize();

app.get("/states/", async (request, response) => {
  const statesQuery = `
    SELECT 
    * 
    FROM
    state
    `;
  const dbResponse = await db.all(statesQuery);
  response.send(
    dbResponse.map((dbObj) => {
      return convertState(dbObj);
    })
  );
});
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const statesQuery = `
    SELECT 
    * 
    FROM
    state
    WHERE state_id=${stateId}
    `;
  const dbResponse = await db.get(statesQuery);
  response.send(convertState(dbResponse));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postQuery = `
 INSERT INTO
 district(district_name,state_id,cases,cured,active,deaths)
 VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(postQuery);
  const districtId = dbResponse.lastID;
  console.log(districtId);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  console.log(districtId);
  const statesQuery = `
    SELECT 
    * 
    FROM
    district
    WHERE district_id='${districtId}';
    `;
  const dbResponse = await db.get(statesQuery);
  response.send(convertDistrict(dbResponse));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteQuery = `
    DELETE FROM 
    district
    WHERE district_id='${districtId}';`;

  const dbResponse = await db.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const putQuery = `
 UPDATE district
 SET
 district_name='${districtName}',
 state_id=${stateId},
 cases=${cases},
 cured=${cured},
 active=${active},
 deaths=${deaths}
 
 WHERE district_id='${districtId}'
 ;`;
  const dbResponse = await db.run(putQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statesQuery = `
    SELECT 
    sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths
    FROM
    district
    WHERE state_id='${stateId}';
    `;
  const dbResponse = await db.get(statesQuery);
  response.send(dbResponse);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const statesQuery = `
    SELECT 
    state.state_name as stateName 
    FROM
    district natural join state
    WHERE district_id=${districtId};
    `;
  const dbResponse = await db.get(statesQuery);
  response.send(dbResponse);
});

module.exports = app;

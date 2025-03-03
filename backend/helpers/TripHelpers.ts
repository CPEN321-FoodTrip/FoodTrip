import fs from "fs";
import readline from "readline";
import { client } from "../services";

const DB_NAME = "geonames";
const COLLECTION_NAME = "cities";
const GEONAMES_FILE = "data/cities15000.txt";

interface GeoNameCity {
  geonameId: number;
  name: string;
  asciiName: string;
  alternateNames: string[];
  latitude: number;
  longitude: number;
  featureClass: string;
  featureCode: string;
  countryCode: string;
  cc2: string;
  admin1Code: string;
  admin2Code: string;
  admin3Code: string;
  admin4Code: string;
  population: number;
  elevation: number;
  dem: number;
  timezone: string;
  modificationDate: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface Location {
  name: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  population: number;
}

interface RouteStop {
  location: Location;
  distanceFromStart: number;
  cumulativeDistance: number;
}

// import data when server starts (if needed)
export async function initializeDatabase() {
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);
  const count = await collection.countDocuments();

  if (count === 0) {
    console.log("No data found in the database. Importing cities...");
    await importGeoNamesToMongoDB(GEONAMES_FILE, DB_NAME, COLLECTION_NAME);
  } else {
    console.log(`Database already contains ${count} cities`);
  }
}

// function to import GeoNames data into MongoDB
async function importGeoNamesToMongoDB(
  filePath: string,
  dbName: string,
  collectionName: string
): Promise<void> {
  const db = client.db(dbName);
  const collection = db.collection<GeoNameCity>(collectionName);

  // check if collection already has data
  const count = await collection.countDocuments();
  if (count > 0) {
    console.log(
      `Collection already contains ${count} documents. Skipping import`
    );
    return;
  }

  console.log("Starting import of GeoNames data...");

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const cities: GeoNameCity[] = [];
  let lineCount = 0;

  for await (const line of rl) {
    if (line.trim() === "") continue;

    const fields = line.split("\t");

    const city: GeoNameCity = {
      geonameId: parseInt(fields[0]),
      name: fields[1],
      asciiName: fields[2],
      alternateNames: fields[3] ? fields[3].split(",") : [],
      latitude: parseFloat(fields[4]),
      longitude: parseFloat(fields[5]),
      featureClass: fields[6],
      featureCode: fields[7],
      countryCode: fields[8],
      cc2: fields[9],
      admin1Code: fields[10],
      admin2Code: fields[11],
      admin3Code: fields[12],
      admin4Code: fields[13],
      population: parseInt(fields[14]),
      elevation: fields[15] ? parseInt(fields[15]) : 0,
      dem: fields[16] ? parseInt(fields[16]) : 0,
      timezone: fields[17],
      modificationDate: fields[18],
      // add GeoJSON point for geospatial queries
      location: {
        type: "Point",
        coordinates: [parseFloat(fields[5]), parseFloat(fields[4])], // [longitude, latitude]
      },
    };

    cities.push(city);
    lineCount++;

    // insert in batches of 1000
    if (cities.length >= 1000) {
      await collection.insertMany(cities);
      cities.length = 0; // clear array
      console.log(`Imported ${lineCount} cities`);
    }
  }

  // insert any remaining cities
  if (cities.length > 0) {
    await collection.insertMany(cities);
    console.log(`Imported ${lineCount} cities`);
  }

  await collection.createIndex({ location: "2dsphere" }); // geospatial index for closest cities
  await collection.createIndex({ population: -1 }); // allow filtering by population
  await collection.createIndex({ countryCode: 1 }); // allow filtering by country code

  console.log("Import completed successfully");
  console.log(
    "Created indexes for geospatial queries and population filtering"
  );
}

// find cities along a route between two locations
async function findCitiesNearRoute(
  start: Location,
  end: Location,
  minPopulation: number = 50000,
  maxDistanceFromRoute: number = 50000 // meters
): Promise<Location[]> {
  const db = client.db(DB_NAME);
  const collection = db.collection<GeoNameCity>(COLLECTION_NAME);

  // generate waypoints along the route (can improve this with interpolation)
  const waypoints = [
    [start.longitude, start.latitude],
    [end.longitude, end.latitude],
  ];

  const allCities = new Set<string>();
  const uniqueCities: Location[] = [];

  for (const coords of waypoints) {
    const point = { type: "Point", coordinates: coords };

    const cities = await collection
      .find({
        location: {
          $near: {
            $geometry: point,
            $maxDistance: maxDistanceFromRoute, // meters
          },
        },
        population: { $gte: minPopulation },
      })
      .toArray();

    for (const city of cities) {
      const cityKey = `${city.name}-${city.countryCode}`;
      if (!allCities.has(cityKey)) {
        allCities.add(cityKey);
        uniqueCities.push({
          name: city.name,
          countryCode: city.countryCode,
          latitude: city.latitude,
          longitude: city.longitude,
          population: city.population,
        });
      }
    }
  }

  // remove start and end cities
  return uniqueCities.filter(
    (city) =>
      !(city.name === start.name && city.countryCode === start.countryCode) &&
      !(city.name === end.name && city.countryCode === end.countryCode)
  );
}

// calculate distance between two points using Haversine formula
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// generate stops along route between start and end locations
export async function generateRouteStops(
  start: Location,
  end: Location,
  numberOfStops: number,
  minCityPopulation: number = 50000,
  maxDistanceFromRoute: number = 50 // km
): Promise<RouteStop[]> {
  // convert km to meters for mongoDB
  const maxDistanceMeters = maxDistanceFromRoute * 1000;

  const eligibleCities = await findCitiesNearRoute(
    start,
    end,
    minCityPopulation,
    maxDistanceMeters
  );

  const totalDistance = calculateDistance(start, end);

  // sort cities by distance from start
  const sortedCities = [...eligibleCities].sort((a, b) => {
    const distanceA = calculateDistance(start, a);
    const distanceB = calculateDistance(start, b);
    return distanceA - distanceB;
  });

  // ideal length between stops
  const segmentLength = totalDistance / (numberOfStops + 1);

  const stops: RouteStop[] = [];
  for (let i = 1; i <= numberOfStops; i++) {
    const idealDistance = i * segmentLength;

    // find city closest to ideal distance
    let bestCity: Location | null = null;
    let minDiff = Infinity;

    for (const city of sortedCities) {
      const cityDistance = calculateDistance(start, city);
      const diff = Math.abs(cityDistance - idealDistance);

      if (diff < minDiff) {
        minDiff = diff;
        bestCity = city;
      }
    }

    // add best city a stop if found
    if (bestCity) {
      const distanceFromStart = calculateDistance(start, bestCity);

      // remove selected city to prevent duplicates
      const index = sortedCities.findIndex(
        (city) =>
          city.name === bestCity!.name &&
          city.countryCode === bestCity!.countryCode
      );
      if (index !== -1) {
        sortedCities.splice(index, 1);
      }

      stops.push({
        location: bestCity,
        distanceFromStart,
        cumulativeDistance: distanceFromStart,
      });
    }
  }

  // sort stops by distance from start
  return stops.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
}

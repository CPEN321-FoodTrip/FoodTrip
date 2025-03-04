import fs from "fs";
import readline from "readline";
import { client } from "../services";
import { ObjectId } from "mongodb";

// constants for GeoNames data
const CITIES_DB_NAME = "geonames";
const CITIES_COLLECTION_NAME = "cities";
const GEONAMES_FILE = "data/cities15000.txt";

// constants for route generation
const MIN_POPULATION = 50000;
const MAX_DISTANCE_FROM_ROUTE = 50000; // meters

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

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
  // added for geospace lookups
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  population: number;
}

interface RouteStop {
  location: Location;
  distanceFromStart: number;
  cumulativeDistance: number;
}

// import geonames data when server starts (if needed)
export async function initializeGeoNamesDatabase() {
  const db = client.db(CITIES_DB_NAME);
  const collection = db.collection(CITIES_COLLECTION_NAME);
  const count = await collection.countDocuments();

  if (count === 0) {
    console.log("No data in database, importing cities");
    await importGeoNamesToMongoDB();
  } else {
    console.log(`Database already contains ${count} cities`);
  }
}

// function to import GeoNames data into MongoDB
async function importGeoNamesToMongoDB(): Promise<void> {
  const db = client.db(CITIES_DB_NAME);
  const collection = db.collection<GeoNameCity>(CITIES_COLLECTION_NAME);
  const fileStream = fs.createReadStream(GEONAMES_FILE);
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
      // add GeoJSON point for geospace lookup
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
      cities.length = 0;
    }
  }

  // insert remaining cities
  if (cities.length > 0) {
    await collection.insertMany(cities);
  }

  await collection.createIndex({ location: "2dsphere" }); // geospatial index for closest cities
  await collection.createIndex({ population: -1 }); // allow filtering by population
  await collection.createIndex({ countryCode: 1 }); // allow filtering by country code
}

// find all cities along a route between two locations that are within a certain distance
async function findCitiesNearRoute(
  start: Location,
  end: Location
): Promise<Location[]> {
  const db = client.db(CITIES_DB_NAME);
  const collection = db.collection<GeoNameCity>(CITIES_COLLECTION_NAME);

  // generate waypoints along the route (TODO: improve this with interpolation)
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
            $maxDistance: MAX_DISTANCE_FROM_ROUTE, // meters
          },
        },
        population: { $gte: MIN_POPULATION },
      })
      .toArray();

    for (const city of cities) {
      if (!allCities.has(city.name)) {
        allCities.add(city.name);
        uniqueCities.push({
          name: city.name,
          latitude: city.latitude,
          longitude: city.longitude,
          population: city.population,
        });
      }
    }
  }

  // remove start and end cities
  return uniqueCities.filter(
    (city) => !(city.name === start.name) && !(city.name === end.name)
  );
}

// calculate distance between two points using Haversine formula
// https://en.wikipedia.org/wiki/Haversine_formula
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
  numberOfStops: number
): Promise<RouteStop[]> {
  const eligibleCities = await findCitiesNearRoute(start, end);

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

    if (bestCity) {
      const distanceFromStart = calculateDistance(start, bestCity);

      // remove selected city to prevent duplicates
      const index = sortedCities.findIndex(
        (city) => city.name === bestCity!.name
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

// save route to MongoDB and return ID
export async function saveRouteToDatabase(
  userID: string,
  route: {}
): Promise<ObjectId> {
  const db = client.db(ROUTES_DB_NAME);
  const collection = db.collection(ROUTES_COLLECTION_NAME);

  const result = await collection.insertOne({ userID, ...route });
  return result.insertedId;
}

// get route from MongoDB by ID (or null if not found)
export async function getRouteFromDatabase(tripID: string): Promise<{} | null> {
  const db = client.db(ROUTES_DB_NAME);
  const collection = db.collection(ROUTES_COLLECTION_NAME);

  const result = await collection.findOne({ _id: new ObjectId(tripID) });
  return result ? result : null;
}

// get all routes from MongoDB for user
export async function getRoutesFromDatabase(userID: string): Promise<{}[]> {
  const db = client.db(ROUTES_DB_NAME);
  const collection = db.collection(ROUTES_COLLECTION_NAME);

  const routes = await collection.find({ userID: userID }).toArray();

  // add tripID to each route
  return routes.map((route) => ({ ...route, tripID: route._id }));
}

import fs from "fs";
import readline from "readline";
import { client } from "../services";
import { ObjectId } from "mongodb";
import {
  GeoNameCity,
  Location,
  RouteStop,
} from "../interfaces/RouteInterfaces";

// constants for GeoNames data
const CITIES_DB_NAME = "geonames";
const CITIES_COLLECTION_NAME = "cities";
const GEONAMES_FILE = "data/cities15000.txt";

// constants for route generation
const MIN_POPULATION = 50000;
const SEARCH_RADIUS = 1000 * 1000; // meters

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

// import geonames data when server starts (if needed)
export async function initializeGeoNamesDatabase() {
  const db = client.db(CITIES_DB_NAME);
  const collection = db.collection(CITIES_COLLECTION_NAME);
  const count = await collection.countDocuments();

  if (count === 0) {
    console.debug("No data in database, importing cities");
    await importGeoNamesToMongoDB();
  } else {
    console.debug(`Database already contains ${count} cities`);
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
      dem: 0, // not used
      timezone: fields[17],
      modificationDate: fields[18],
      // add GeoJSON point for geospace lookup
      location: {
        type: "Point",
        coordinates: [parseFloat(fields[5]), parseFloat(fields[4])], // [longitude, latitude]
      },
    };

    cities.push(city);

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
}

// helper function to fetch city data from OpenStreetMap API
export async function fetchCityData(city: string): Promise<any | null> {
  const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
    city
  )}&format=json&limit=1`;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch city data: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    throw new Error(
      `Error fetching city data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
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

// calculate a point at a given percentage along the path
// based on great-circle interpolation: https://en.wikipedia.org/wiki/Great-circle_distance
function interpolatePoint(
  start: Location,
  end: Location,
  fraction: number
): { latitude: number; longitude: number } {
  const lat1 = toRadians(start.latitude);
  const lon1 = toRadians(start.longitude);
  const lat2 = toRadians(end.latitude);
  const lon2 = toRadians(end.longitude);

  // angular distance between points (using haversine formula: https://en.wikipedia.org/wiki/Haversine_formula)
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.pow(Math.sin((lon2 - lon1) / 2), 2)
      )
    );

  // if distance is zero, return start point
  if (Math.abs(d) < 1e-10) {
    return { latitude: start.latitude, longitude: start.longitude };
  }

  // calculate stop point
  const A = Math.sin((1 - fraction) * d) / Math.sin(d);
  const B = Math.sin(fraction * d) / Math.sin(d);

  const x =
    A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y =
    A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);

  return {
    latitude: (lat * 180) / Math.PI,
    longitude: (lon * 180) / Math.PI,
  };
}

// generate stops along route between start and end locations
export async function generateRouteStops(
  start: Location,
  end: Location,
  numberOfStops: number
): Promise<RouteStop[]> {
  const stops: RouteStop[] = [];
  const db = client.db(CITIES_DB_NAME);
  const collection = db.collection(CITIES_COLLECTION_NAME);

  for (let i = 1; i <= numberOfStops; i++) {
    const segmentPercentage = i / (numberOfStops + 1);
    const idealPoint = interpolatePoint(start, end, segmentPercentage);

    const nearbyCities = await collection
      .find({
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [idealPoint.longitude, idealPoint.latitude],
            },
            $maxDistance: SEARCH_RADIUS,
          },
        },
        population: { $gte: MIN_POPULATION },
        // ignore start/end cities and any existing stops
        $nor: [
          {
            name: start.name,
          },
          {
            name: end.name,
          },
          ...stops.map((stop) => ({ name: stop.location.name })),
        ],
      })
      .sort({ population: -1 }) // sort based on population
      .limit(10)
      .toArray();

    // choose city closest to ideal point
    if (nearbyCities.length > 0) {
      const citiesWithDistance = nearbyCities.map((city) => {
        const location: Location = {
          name: city.name,
          latitude: city.latitude,
          longitude: city.longitude,
          population: city.population,
        };

        const distanceFromIdealPoint = calculateDistance(
          { ...location, name: "", population: 0 },
          { ...idealPoint, name: "", population: 0 }
        );

        const distanceFromStart = calculateDistance(start, location);

        return {
          location,
          distanceFromIdealPoint,
          distanceFromStart,
        };
      });

      citiesWithDistance.sort(
        (a, b) => a.distanceFromIdealPoint - b.distanceFromIdealPoint
      );

      // closest city to ideal point
      const bestCity = citiesWithDistance[0];

      stops.push({
        location: bestCity.location,
        distanceFromStart: bestCity.distanceFromStart,
        cumulativeDistance: bestCity.distanceFromStart,
        segmentPercentage: segmentPercentage * 100,
      });
    } else {
      console.log(
        `No cities found for segment ${i} at ${segmentPercentage * 100}`
      );
    }
  }

  // sort by distance from start
  return stops.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
}

// save route to MongoDB and return ID
export async function saveRouteToDb(
  userID: string,
  route: {}
): Promise<ObjectId> {
  const db = client.db(ROUTES_DB_NAME);
  const collection = db.collection(ROUTES_COLLECTION_NAME);

  const result = await collection.insertOne({ userID, ...route });
  return result.insertedId;
}

// get route from MongoDB by ID (or null if not found)
export const getRouteFromDb = async(tripID: string): Promise<{} | null> => {
  const db = client.db(ROUTES_DB_NAME);
  const collection = db.collection(ROUTES_COLLECTION_NAME);

  return await collection.findOne({ _id: new ObjectId(tripID) });
}

// delete route from MongoDB by ID
export const deleteRouteFromDb = async(tripID: string): Promise<number> => {
  const db = client.db(ROUTES_DB_NAME);
  const collection = db.collection(ROUTES_COLLECTION_NAME);

  const result = await collection.deleteOne({ _id: new ObjectId(tripID) });

  return result.deletedCount;
}

import axios from "axios";
import fs from "fs";

interface GeoNameCity {
  geonameId: number;
  name: string;
  asciiName: string;
  alternateNames: string;
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

// Function to load GeoNames data from file
async function loadGeoNamesData(filePath: string): Promise<Location[]> {
  // You can either parse a downloaded GeoNames file or use their API
  try {
    const data = await fs.promises.readFile(filePath, "utf-8");
    const lines = data.split("\n").filter((line) => line.trim() !== "");

    return lines.map((line) => {
      const fields = line.split("\t");
      return {
        name: fields[1],
        countryCode: fields[8],
        latitude: parseFloat(fields[4]),
        longitude: parseFloat(fields[5]),
        population: parseInt(fields[14]) || 0,
      };
    });
  } catch (error) {
    console.error("Failed to load GeoNames data:", error);
    return [];
  }
}

// Alternative: Load data from GeoNames API
export async function fetchCitiesFromGeoNames(
  username: string,
  minPopulation: number = 100000
): Promise<Location[]> {
  try {
    // GeoNames free API requires a username
    const response = await axios.get(`http://api.geonames.org/citiesJSON`, {
      params: {
        north: 90,
        south: -90,
        east: 180,
        west: -180,
        maxRows: 1000, // Adjust based on your needs
        username: username,
        cities: "cities1000", // Cities with population > 1000
        orderby: "population", // Sort by population
      },
    });

    console.log("GeoNames API Response:", response.data);

    if (!response.data || !response.data.geonames) {
      console.error("Unexpected API response structure:", response.data);
      return [];
    }

    return response.data.geonames
      .filter((city: any) => city.population >= minPopulation)
      .map((city: any) => ({
        name: city.name,
        countryCode: city.countryCode,
        latitude: city.lat,
        longitude: city.lng,
        population: city.population,
      }));
  } catch (error) {
    console.error("Failed to fetch from GeoNames API:", error);
    return [];
  }
}

// Calculate distance between two points using the Haversine formula
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in km
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

// Calculate bearing between two points
function calculateBearing(start: Location, end: Location): number {
  const startLat = toRadians(start.latitude);
  const startLng = toRadians(start.longitude);
  const endLat = toRadians(end.latitude);
  const endLng = toRadians(end.longitude);

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

  let bearing = Math.atan2(y, x);
  bearing = ((bearing * 180) / Math.PI + 360) % 360; // Convert to degrees
  return bearing;
}

// Calculate if a point is close to the route (within a certain corridor width)
function isPointNearRoute(
  point: Location,
  start: Location,
  end: Location,
  maxDistance: number
): boolean {
  // Create a bounding box for quick filtering
  const minLat = Math.min(start.latitude, end.latitude) - maxDistance / 111; // rough conversion to degrees
  const maxLat = Math.max(start.latitude, end.latitude) + maxDistance / 111;
  const minLng =
    Math.min(start.longitude, end.longitude) -
    maxDistance /
      (111 * Math.cos(toRadians((start.latitude + end.latitude) / 2)));
  const maxLng =
    Math.max(start.longitude, end.longitude) +
    maxDistance /
      (111 * Math.cos(toRadians((start.latitude + end.latitude) / 2)));

  // Quick check if point is outside the extended bounding box
  if (
    point.latitude < minLat ||
    point.latitude > maxLat ||
    point.longitude < minLng ||
    point.longitude > maxLng
  ) {
    return false;
  }

  // For more precise check, calculate the cross-track distance
  const distanceStartToPoint = calculateDistance(start, point);
  const bearingStartToPoint = calculateBearing(start, point);
  const bearingStartToEnd = calculateBearing(start, end);

  // Calculate the angular distance in radians
  const angularDistance = toRadians(distanceStartToPoint / 6371);

  // Calculate the cross-track distance
  const crossTrackDistance =
    Math.asin(
      Math.sin(angularDistance) *
        Math.sin(toRadians(bearingStartToPoint - bearingStartToEnd))
    ) * 6371;

  return Math.abs(crossTrackDistance) <= maxDistance;
}

// Generate stops along a route between start and end locations
export async function generateRouteStops(
  start: Location,
  end: Location,
  numberOfStops: number,
  cities: Location[],
  minCityPopulation: number = 50000,
  maxDistanceFromRoute: number = 50 // in km
): Promise<RouteStop[]> {
  const totalDistance = calculateDistance(start, end);

  // Filter cities to only include those near the route and with sufficient population
  const eligibleCities = cities.filter(
    (city) =>
      city.population >= minCityPopulation &&
      isPointNearRoute(city, start, end, maxDistanceFromRoute) &&
      // Exclude the start and end cities
      !(city.name === start.name && city.countryCode === start.countryCode) &&
      !(city.name === end.name && city.countryCode === end.countryCode)
  );

  // Sort cities by their distance from the start
  const sortedCities = [...eligibleCities].sort((a, b) => {
    const distanceA = calculateDistance(start, a);
    const distanceB = calculateDistance(start, b);
    return distanceA - distanceB;
  });

  // Ideal segment length between stops
  const segmentLength = totalDistance / (numberOfStops + 1);

  // Generate stops
  const stops: RouteStop[] = [];
  for (let i = 1; i <= numberOfStops; i++) {
    const idealDistance = i * segmentLength;

    // Find the city closest to the ideal distance
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

    // Add the best city as a stop if found
    if (bestCity) {
      const distanceFromStart = calculateDistance(start, bestCity);

      // Remove the selected city to avoid duplicates
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

  // Sort stops by distance from start
  return stops.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
}

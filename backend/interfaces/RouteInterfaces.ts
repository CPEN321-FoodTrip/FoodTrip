export interface GeoNameCity {
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

export interface RouteStop {
  location: Location;
  distanceFromStart: number;
  cumulativeDistance: number;
  segmentPercentage: number;
}

export interface Route {
  start_location: Location;
  end_location: Location;
  stops: RouteStop[];
}

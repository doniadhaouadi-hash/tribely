import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type City = {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
};

const FRANKFURT: City = {
  name: "Frankfurt",
  country: "Germany",
  countryCode: "DE",
  lat: 50.1109,
  lng: 8.6821,
};

type LocationContextValue = {
  city: City;
  setCity: (c: City) => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [city, setCity] = useState<City>(FRANKFURT);
  const value = useMemo(() => ({ city, setCity }), [city]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
};

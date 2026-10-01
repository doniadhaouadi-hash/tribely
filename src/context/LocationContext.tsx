import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { cityFromProfile, loadStoredCity, sameCity, storeCity } from "@/lib/cityStorage";

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
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

const saveCityToProfile = async (userId: string, c: City) => {
  const { error } = await supabase
    .from("profiles")
    .update({ city: c.name, lat: c.lat, lng: c.lng })
    .eq("id", userId);
  if (error) console.warn("Couldn't save city to profile", error.message);
};

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  // Survives reloads: last city picked on this device, else Frankfurt.
  const [city, setCityState] = useState<City>(() => loadStoredCity() ?? FRANKFURT);
  const [pickerOpen, setPickerOpen] = useState(false);
  const syncedProfileFor = useRef<string | null>(null);

  // Once per login, reconcile with the city saved on the profile.
  useEffect(() => {
    if (!profile) {
      syncedProfileFor.current = null;
      return;
    }
    if (syncedProfileFor.current === profile.id) return;
    syncedProfileFor.current = profile.id;

    const stored = loadStoredCity();
    const profileIsDefault = sameCity(FRANKFURT, profile);
    if (profileIsDefault && stored && !sameCity(stored, profile)) {
      // Fresh profile, but the user already picked a city on this device
      // (e.g. before signing up): keep it and save it to the profile.
      saveCityToProfile(profile.id, stored);
      return;
    }
    const next = cityFromProfile(profile, stored);
    setCityState(next);
    storeCity(next);
  }, [profile]);

  const setCity = useCallback(
    (c: City) => {
      setCityState(c);
      storeCity(c);
      if (user) saveCityToProfile(user.id, c);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      city,
      setCity,
      pickerOpen,
      openPicker: () => setPickerOpen(true),
      closePicker: () => setPickerOpen(false),
    }),
    [city, setCity, pickerOpen],
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
};

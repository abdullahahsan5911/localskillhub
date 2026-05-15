import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FiMapPin } from "react-icons/fi";
import { Country, City } from "country-state-city";

export interface DetailedLocation {
  country: string;
  city: string;
  street: string;
}

interface LocationInputProps {
  value: DetailedLocation;
  onChange: (value: DetailedLocation) => void;
}

export default function LocationInput({ value, onChange }: LocationInputProps) {
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
  const [cities, setCities] = useState<any[]>([]);

  const countries = Country.getAllCountries();

  // Sync country code with the current country name value
  useEffect(() => {
    if (value?.country) {
      const country = countries.find((c) => c.name === value.country);
      if (country) {
        setSelectedCountryCode(country.isoCode);
      }
    } else {
      setSelectedCountryCode("");
    }
  }, [value?.country, countries]);

  // Update cities when country code changes
  useEffect(() => {
    if (selectedCountryCode) {
      setCities(City.getCitiesOfCountry(selectedCountryCode) || []);
    } else {
      setCities([]);
    }
  }, [selectedCountryCode]);

  const selectClasses =
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center">
        <FiMapPin className="mr-1 text-slate-500" size={14} />
        Detailed Location
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <select
            value={selectedCountryCode}
            onChange={(e) => {
              const code = e.target.value;
              setSelectedCountryCode(code);
              const country = Country.getCountryByCode(code);
              onChange({ ...value, country: country?.name || "", city: "" });
            }}
            className={selectClasses}
          >
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={value?.city || ""}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            className={selectClasses}
            disabled={!selectedCountryCode || cities.length === 0}
          >
            <option value="">
              {selectedCountryCode
                ? cities.length > 0
                  ? "Select City"
                  : "No cities found"
                : "Select Country First"}
            </option>
            {cities.map((c, idx) => (
              <option key={`${c.stateCode}-${c.name}-${idx}`} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Input
            placeholder="Street Address"
            value={value?.street || ""}
            onChange={(e) => onChange({ ...value, street: e.target.value })}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}

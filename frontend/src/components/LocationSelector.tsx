import { useEffect, useMemo } from "react";
import { City, Country, State } from "country-state-city";

export interface LocationValue {
  country: string;
  state: string;
  city: string;
}

interface LocationSelectorProps {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  className?: string;
  layout?: "row" | "column";
}

const fieldClassName =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500";

const LocationSelector = ({ value, onChange, className, layout = "column" }: LocationSelectorProps) => {
  const countries = useMemo(
    () => Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const selectedCountry = useMemo(
    () => countries.find((country) => country.name === value.country),
    [countries, value.country],
  );

  const states = useMemo(() => {
    if (!selectedCountry) return [];
    return State.getStatesOfCountry(selectedCountry.isoCode).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCountry]);

  const selectedState = useMemo(
    () => states.find((state) => state.name === value.state),
    [states, value.state],
  );

  const cities = useMemo(() => {
    if (!selectedCountry) return [];

    if (selectedState) {
      return City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode).sort((a, b) => a.name.localeCompare(b.name));
    }

    return City.getCitiesOfCountry(selectedCountry.isoCode).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCountry, selectedState]);

  useEffect(() => {
    if (!value.state) return;

    const isStateValid = states.some((state) => state.name === value.state);
    if (!isStateValid) {
      onChange({ country: value.country, state: "", city: "" });
    }
  }, [onChange, states, value.city, value.country, value.state]);

  useEffect(() => {
    if (!value.city) return;

    const isCityValid = cities.some((city) => city.name === value.city);
    if (!isCityValid) {
      onChange({ country: value.country, state: value.state, city: "" });
    }
  }, [cities, onChange, value.city, value.country, value.state]);

  const handleCountryChange = (countryName: string) => {
    onChange({
      country: countryName,
      state: "",
      city: "",
    });
  };

  const handleStateChange = (stateName: string) => {
    onChange({
      country: value.country,
      state: stateName,
      city: "",
    });
  };

  const handleCityChange = (cityName: string) => {
    onChange({
      country: value.country,
      state: value.state,
      city: cityName,
    });
  };

  const fieldsWrapperClassName =
    layout === "row"
      ? "grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3"
      : "space-y-2.5";

  return (
    <div className={className}>
      <div className={fieldsWrapperClassName}>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600">Country/Region</label>
          <select
            value={value.country}
            onChange={(event) => handleCountryChange(event.target.value)}
            className={fieldClassName}
          >
            <option value="">Select a Country/Region</option>
            {countries.map((country) => (
              <option key={country.isoCode} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600">State</label>
          <select
            value={value.state}
            onChange={(event) => handleStateChange(event.target.value)}
            className={fieldClassName}
            disabled={!selectedCountry || states.length === 0}
          >
            <option value="">{selectedCountry ? "Select a State" : "Select Country First"}</option>
            {states.map((state) => (
              <option key={state.isoCode} value={state.name}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600">City</label>
          <select
            value={value.city}
            onChange={(event) => handleCityChange(event.target.value)}
            className={fieldClassName}
            disabled={!selectedCountry || cities.length === 0}
          >
            <option value="">{selectedCountry ? "Select a City" : "Select Country First"}</option>
            {cities.map((city) => (
              <option key={`${city.name}-${city.latitude}-${city.longitude}`} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;

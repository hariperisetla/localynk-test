import React, { useState, useEffect } from "react";
import { Country, State, City } from "country-state-city";
import Select from "react-select";

export default function PlaceInput() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  // Fetch initial country options
  useEffect(() => {
    const countries = Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      label: country.name,
    }));

    const cities = City.getAllCities();

    console.log(cities.filter((city) => city.stateCode === "TG"));

    setCountryOptions(countries);
  }, []);

  // Handle changes in country selection
  const handleCountryChange = (selectedOption) => {
    setSelectedCountry(selectedOption);
    setSelectedState(null);
    setSelectedCity(null);

    // Fetch states for the selected country
    const states = State.getStatesOfCountry(selectedOption.value).map(
      (state) => ({
        value: state.isoCode,
        label: state.name,
      })
    );
    setStateOptions(states);
  };

  // Handle changes in state selection
  const handleStateChange = (selectedOption) => {
    setSelectedState(selectedOption);
    setSelectedCity(null);

    console.log(selectedCountry);

    // Fetch cities for the selected state
    const cities = City.getCitiesOfState(
      selectedCountry.value,
      selectedOption.value
    ).map((city) => ({
      value: city.name,
      label: city.name,
    }));
    setCityOptions(cities);
  };

  // Handle changes in city selection
  const handleCityChange = (selectedOption) => {
    setSelectedCity(selectedOption);
  };

  return (
    <div>
      <h2>Location Form</h2>
      <div className="space-y-3">
        <Select
          value={selectedCountry}
          onChange={handleCountryChange}
          options={countryOptions}
          placeholder="Select Country"
          isSearchable
        />
        <Select
          value={selectedState}
          onChange={handleStateChange}
          options={stateOptions}
          placeholder="Select State"
          isSearchable
          isDisabled={!selectedCountry}
        />
        <Select
          value={selectedCity}
          onChange={handleCityChange}
          options={cityOptions}
          placeholder="Select City"
          isSearchable
          isDisabled={!selectedState}
        />
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import icon from "@/app/favicon.ico";
import {
  IoAddCircle,
  IoCreate,
  IoHelpCircle,
  IoMoon,
  IoSunny,
  IoTrash,
} from "react-icons/io5";
import { Country, State, City } from "country-state-city";
import Select from "react-select";

import PlaceInput from "@/components/PlaceInput";
import Link from "next/link";

// Function to open IndexedDB database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("contactsDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore("contacts", { keyPath: "id", autoIncrement: true });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(`IndexedDB error: ${event.target.error}`);
    };
  });
}

export default function Home() {
  const [contacts, setContacts] = useState([]);
  const [bottomSheet, setBottomSheet] = useState(false);
  const [error, setError] = useState("");
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    timezone: "",
    place: "",
  });

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
    const time = Country.getCountryByCode(selectedOption.value).timezones[0]
      .gmtOffsetName;

    setNewContact({ ...newContact, timezone: time });
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

    setNewContact({ ...newContact, place: selectedOption.label });
  };

  useEffect(() => {
    openDB()
      .then((db) => {
        // Fetch contacts from IndexedDB
        fetchContacts(db);
      })
      .catch((error) => {
        setError(`Failed to open IndexedDB: ${error}`);
        // For testing, load the sample data initially
        setContacts(testData);
      });
  }, []);

  // Fetch contacts from IndexedDB
  const fetchContacts = (db) => {
    const transaction = db.transaction("contacts", "readonly");
    const objectStore = transaction.objectStore("contacts");
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      const storedContacts = event.target.result;
      if (storedContacts && storedContacts.length > 0) {
        setContacts(storedContacts);
      } else {
        // For testing, load the sample data initially
        setContacts(testData);
      }
    };

    request.onerror = (event) => {
      setError(`Failed to fetch contacts: ${event.target.error}`);
      // For testing, load the sample data initially
      setContacts(testData);
    };
  };

  // Save contacts to IndexedDB whenever they change
  const saveContacts = (db, updatedContacts) => {
    const transaction = db.transaction("contacts", "readwrite");
    const objectStore = transaction.objectStore("contacts");

    objectStore.clear(); // Clear existing contacts
    updatedContacts.forEach((contact) => {
      objectStore.add(contact); // Add each contact
    });

    transaction.oncomplete = () => {
      console.log("Contacts saved to IndexedDB.");
    };

    transaction.onerror = (event) => {
      setError(`Failed to save contacts: ${event.target.error}`);
    };
  };

  // Update local time for each contact every second
  useEffect(() => {
    const interval = setInterval(() => {
      setContacts((prevContacts) =>
        prevContacts.map((contact) => {
          const localTime = calculateLocalTime(contact.timezone);
          return { ...contact, localTime };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewContact({ ...newContact, [name]: value });
  };

  const handleAddContact = () => {
    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    openDB().then((db) => saveContacts(db, updatedContacts));
    setNewContact({ name: "", email: "", timezone: "", place: "" });
  };

  const handleDeleteContact = (contactId) => {
    const confirmDelete = window.confirm(
      "Do you really want to delete this contact?"
    );

    if (confirmDelete) {
      const updatedContacts = contacts.filter(
        (contact) => contact.id !== contactId
      );
      setContacts(updatedContacts);
      openDB().then((db) => saveContacts(db, updatedContacts));
    }
  };

  const handleUpdateContact = (index, field, value) => {
    const updatedContacts = contacts.map((contact, i) =>
      i === index ? { ...contact, [field]: value } : contact
    );
    setContacts(updatedContacts);
    openDB().then((db) => saveContacts(db, updatedContacts));
  };

  const testData = [
    {
      name: "John Doe",
      email: "john.doe@example.com",
      timezone: "GMT-5",
      place: "New York",
      icon: icon,
    },
    {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      timezone: "GMT+1",
      place: "London",
    },
    {
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      timezone: "GMT+8",
      place: "Singapore",
    },
    {
      name: "Bob Brown Henderson",
      email: "bob.brown@example.com",
      timezone: "GMT-7",
      place: "Los Angeles",
    },
  ];

  function openContactPicker() {
    const supported = "contacts" in navigator && "ContactsManager" in window;

    if (supported) {
      getContacts();
    } else {
      // alert(
      //   "Contact list API not supported! Only for Android mobile Chrome and Chrome version > 80"
      // );

      setContacts(testData);
    }
  }

  async function getContacts() {
    const props = ["name", "email", "tel", "icon"];
    const opts = { multiple: false };

    try {
      const selectedContacts = await navigator.contacts.select(props, opts);

      if (selectedContacts.length > 0) {
        const selectedContact = selectedContacts[0]; // Get the first contact

        const contactData = {
          name: selectedContact.name[0], // name, email, tel, and icon are arrays
          email: selectedContact.email[0],
          tel: selectedContact.tel[0],
          icon: selectedContact.icon[0],
          timezone: "",
          place: "",
        };

        setNewContact(contactData); // Update the state using setContacts
      }
    } catch (err) {
      alert(err);
    }
  }

  const calculateLocalTime = (timezone) => {
    const date = new Date();
    const utcOffset = date.getTimezoneOffset();
    const localOffset = timezoneToOffset(timezone);
    const localTime = new Date(
      date.getTime() + (utcOffset + localOffset) * 60000
    );
    return localTime;
  };

  const timezoneToOffset = (timezone) => {
    const sign = timezone.startsWith("GMT-") ? -1 : 1;
    const hours = parseInt(timezone.slice(4));
    return sign * hours * 60;
  };

  const isDayTime = (localTime) => {
    const hours = localTime.getHours();
    return hours >= 6 && hours < 18;
  };

  const [moreInfoFlag, setMoreInfoFlag] = useState(-1);

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      border: state.isFocused ? "1px solid #3b82f6" : "1px solid #93c5fd",
      borderRadius: "0.375rem",
      padding: "0.5rem",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
      "&:hover": {
        border: "1px solid #3b82f6",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#374151",
    }),
  };

  return (
    <main className="bg-sky-50/50 min-h-screen p-3">
      <div className="max-w-md mx-auto">
        {error && <div className="text-red-500 mt-2">{error}</div>}
        <div className="flex justify-between items-center pt-3">
          <div>
            <h2 className="text-2xl font-semibold text-sky-700">Localynk</h2>
          </div>
          <button
            onClick={() => setBottomSheet(!bottomSheet)}
            className="text-4xl text-sky-700"
          >
            <IoAddCircle />
          </button>
        </div>
        {contacts.length > 0 && (
          <div className="mt-4">
            <ul className="mt-4 space-y-3">
              {contacts.map((contact, index) => {
                const localTime = calculateLocalTime(contact.timezone);
                const timeString = localTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const dayOrNight = isDayTime(localTime) ? "Day" : "Night";
                return (
                  <li
                    key={contact.id}
                    onClick={() => {
                      moreInfoFlag !== -1 && moreInfoFlag === contact.id
                        ? setMoreInfoFlag(-1)
                        : setMoreInfoFlag(contact.id);
                    }}
                    className="bg-white space-y-5 rounded-xl p-4 border border-sky-200"
                  >
                    <div className="grid grid-cols-4 items-center justify-between">
                      <div className="grid grid-cols-4 col-span-2 items-center space-x-3">
                        <div className="col-span-1">
                          {contact.icon ? (
                            <Image
                              src={contact.icon}
                              alt="contact icon"
                              width={45}
                              height={45}
                            />
                          ) : (
                            <div className="bg-gray-500 h-[45px] w-[45px] rounded-full"></div>
                          )}
                        </div>
                        <div className="col-span-3">
                          <h3 className="font-semibold text-base text-gray-900">
                            {contact.name}
                          </h3>
                          <p className="text-sm text-gray-400">Monday</p>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center items-center">
                        <p>
                          {isDayTime(localTime) ? (
                            <IoSunny className="text-yellow-500" size={30} />
                          ) : (
                            <IoMoon className="text-slate-700" size={30} />
                          )}
                        </p>
                        <p className="text-sm text-gray-400">{dayOrNight}</p>
                      </div>
                      <div className="">
                        <div className="text-right">
                          <p className="text-2xl">{timeString}</p>
                          <p className="text-sm text-gray-400">
                            {contact.place}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`${
                        moreInfoFlag === contact.id ? "flex" : "hidden"
                      } text-2xl transition-all duration-500 ease-in-out pb-2 pt-5 w-full justify-between border-t`}
                    >
                      <Link href={`/person/${contact.id}`}>
                        <IoHelpCircle className="text-sky-700" />
                      </Link>{" "}
                      <IoCreate className="text-green-700" />{" "}
                      <button onClick={() => handleDeleteContact(contact.id)}>
                        <IoTrash className="text-red-700" />
                      </button>
                    </div>
                    {/* <button onClick={() => handleDeleteContact(contact.id)}>
                      Delete
                    </button> */}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div>
        <div
          className={`${
            bottomSheet ? "opacity-100" : "hidden"
          } fixed inset-0 overflow-y-auto z-30 transition-all ease-in-out duration-300`}
        >
          <div
            className="bg-black/50 h-screen w-full z-20 absolute"
            onClick={() => setBottomSheet(!bottomSheet)}
          ></div>
        </div>
        <div className="relative">
          <div
            className={`${
              bottomSheet ? "bottom-0" : "-bottom-[60rem]"
            } z-30 left-0 space-y-5 rounded-t-2xl bg-white px-5 transition-all duration-300 ease-in-out w-full py-8 fixed`}
          >
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-primary">
                Add a contact
              </h3>
              {/* <p></p> */}
            </div>
            <button
              onClick={openContactPicker}
              className="w-full bg-sky-700 text-white font-semibold px-4 py-2 rounded-lg shadow"
            >
              Pick a Contact
            </button>
            <div>
              <form className="space-y-3">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="">Name</label>
                  <input
                    type="text"
                    name="name"
                    onChange={handleInputChange}
                    value={newContact.name}
                    className="border border-sky-300 focus:border-sky-500 rounded-lg outline-none px-2 py-2"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="">Place</label>
                  <div className="space-y-3">
                    <Select
                      styles={customStyles}
                      name="country"
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      options={countryOptions}
                      placeholder="Select Country"
                      isSearchable
                    />
                    <Select
                      name="state"
                      value={selectedState}
                      onChange={handleStateChange}
                      options={stateOptions}
                      placeholder="Select State"
                      isSearchable
                      isDisabled={!selectedCountry}
                    />
                    <Select
                      name="city"
                      value={selectedCity}
                      onChange={handleCityChange}
                      options={cityOptions}
                      placeholder="Select City"
                      isSearchable
                      isDisabled={!selectedState}
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="">Timezone</label>
                  <input
                    name="timezone"
                    type="text"
                    onChange={handleInputChange}
                    value={newContact.timezone}
                    disabled
                    className="border border-sky-300 focus:border-sky-500 rounded-lg outline-none px-2 py-2"
                  />
                </div>

                <button
                  type="submit"
                  onClick={handleAddContact}
                  className="w-full bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow"
                >
                  Add Friend
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

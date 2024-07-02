"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState("");

  // Load contacts from localStorage on component mount
  useEffect(() => {
    const storedContacts = localStorage.getItem("contacts");
    if (storedContacts) {
      setContacts(JSON.parse(storedContacts));
    }
  }, []);

  function openContactPicker() {
    const supported = "contacts" in navigator && "ContactsManager" in window;

    if (supported) {
      getContacts();
    } else {
      alert(
        "Contact list API not supported! Only for Android mobile Chrome and Chrome version > 80"
      );
    }
  }

  async function getContacts() {
    const props = ["name", "email", "tel"];
    const opts = { multiple: true };

    try {
      const selectedContacts = await navigator.contacts.select(props, opts);
      if (selectedContacts.length > 0) {
        const newContacts = [...contacts, ...selectedContacts];
        setContacts(newContacts);
        localStorage.setItem("contacts", JSON.stringify(newContacts));
      }
    } catch (err) {
      alert(err);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <button
          onClick={openContactPicker}
          className="bg-blue-500 px-5 py-3 hover:bg-blue-400"
        >
          Pick a Contact
        </button>
        {error && <div className="error">{error}</div>}
        {contacts.length > 0 && (
          <div>
            <h2>Contacts List</h2>
            <ul>
              {contacts.map((contact, index) => (
                <li key={index} className="contact-item">
                  <p>Name: {contact.name}</p>
                  <p>Email: {contact.email}</p>
                  <p>Tel: {contact.tel}</p>
                  {/* Render other contact details as needed */}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}

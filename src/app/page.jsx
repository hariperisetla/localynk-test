"use client";

import Image from "next/image";

import { useState } from "react";

export default function Home() {
  const [contact, setContact] = useState(null);
  const [error, setError] = useState("");
  // const props = ["name", "email", "tel", "address", "icon"];
  // const opts = { multiple: true };
  function openContactPicker() {
    const supported = "contacts" in navigator && "ContactsManager" in window;

    if (supported) {
      getContacts();
    } else {
      alert(
        "Contact list API not supported!. Only for android mobile chrome and chrome version > 80"
      );
    }
  }
  async function getContacts() {
    const props = ["name", "email", "tel"];
    const opts = { multiple: true };

    try {
      const contacts = await navigator.contacts.select(props, opts);
      alert(JSON.stringify(contacts));
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
        {error && error}
        {contact && (
          <div>
            <h2>Contact Selected</h2>
            <p>Name: {contact.name}</p>
            <p>Email: {contact.email}</p>
            {/* Render other contact details as needed */}
          </div>
        )}
      </div>
    </main>
  );
}

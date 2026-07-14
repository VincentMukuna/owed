import { describe, expect, it } from "vitest";

import {
  type ContactPhoneDetails,
  filterContactPhoneViews,
  toContactPhoneViews,
} from "../lib/contact-phone-utils";

const contacts: ContactPhoneDetails[] = [
  {
    id: "jose",
    fullName: "José Kamau",
    phones: [
      { id: "mobile", label: "mobile", number: "+254 700 123 456" },
      { id: "duplicate", label: "home", number: "+254700123456" },
    ],
  },
  {
    id: "amina",
    fullName: "Amina Noor",
    phones: [{ id: "work", label: "work", number: "020 555 0100" }],
  },
  {
    id: "no-phone",
    fullName: "No Phone",
    phones: [],
  },
];

describe("contact phone utilities", () => {
  it("keeps contacts with usable phone numbers and removes duplicate formats", () => {
    const views = toContactPhoneViews(contacts);
    const jose = views.find((contact) => contact.id === "jose");

    expect(views).toHaveLength(2);
    expect(jose?.phones).toEqual([{ id: "mobile", label: "mobile", number: "+254 700 123 456" }]);
  });

  it("sorts contacts by name", () => {
    const views = toContactPhoneViews(contacts);

    expect(views.map((contact) => contact.name)).toEqual(["Amina Noor", "José Kamau"]);
  });

  it("matches names without accents and phone-number digits", () => {
    const views = toContactPhoneViews(contacts);

    expect(filterContactPhoneViews(views, "jose").map((contact) => contact.id)).toEqual(["jose"]);
    expect(filterContactPhoneViews(views, "5550100").map((contact) => contact.id)).toEqual([
      "amina",
    ]);
  });
});

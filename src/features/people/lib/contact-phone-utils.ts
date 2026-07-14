export type ContactPhoneDetails = {
  id: string;
  fullName?: string | null;
  phones: {
    id: string;
    label?: string;
    number?: string;
  }[];
};

export type ContactPhoneView = {
  id: string;
  name: string;
  searchName: string;
  searchNumbers: string[];
  phones: {
    id: string;
    label: string;
    number: string;
  }[];
};

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function phoneSearchValue(value: string): string {
  return value.replace(/\D/g, "");
}

function toPhoneView(phone: ContactPhoneDetails["phones"][number]) {
  const number = phone.number?.trim();
  if (!number) {
    return undefined;
  }

  return {
    id: phone.id,
    label: phone.label?.trim() || "phone",
    number,
  };
}

export function toContactPhoneViews(contacts: ContactPhoneDetails[]): ContactPhoneView[] {
  const result: ContactPhoneView[] = [];
  const seenContactNumbers = new Set<string>();

  for (const contact of contacts) {
    const name = contact.fullName?.trim() || "Unnamed contact";
    const searchName = normalizeSearchValue(name);
    const phones: ContactPhoneView["phones"] = [];

    for (const phone of contact.phones) {
      const mapped = toPhoneView(phone);
      if (!mapped) continue;

      const comparable = phoneSearchValue(mapped.number);
      const contactNumberKey = `${searchName}:${comparable}`;
      if (!comparable || seenContactNumbers.has(contactNumberKey)) continue;

      seenContactNumbers.add(contactNumberKey);
      phones.push(mapped);
    }

    if (phones.length === 0) continue;

    result.push({
      id: contact.id,
      name,
      searchName,
      searchNumbers: phones.map((phone) => phoneSearchValue(phone.number)),
      phones,
    });
  }

  result.sort(
    (left, right) =>
      left.searchName.localeCompare(right.searchName) || left.name.localeCompare(right.name),
  );

  return result;
}

export function filterContactPhoneViews(
  contacts: ContactPhoneView[],
  query: string,
): ContactPhoneView[] {
  const normalizedQuery = normalizeSearchValue(query);
  const numberQuery = phoneSearchValue(query);

  if (!normalizedQuery) {
    return contacts;
  }

  const result: ContactPhoneView[] = [];
  for (const contact of contacts) {
    if (contact.searchName.includes(normalizedQuery)) {
      result.push(contact);
      continue;
    }

    if (
      numberQuery.length > 0 &&
      contact.searchNumbers.some((number) => number.includes(numberQuery))
    ) {
      result.push(contact);
    }
  }

  return result;
}

export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  facts: { year: number; text: string }[];
}

export const hotspots: Hotspot[] = [
  {
    id: "main-building",
    name: "KTH Main Building",
    lat: 59.3473,
    lng: 18.0727,
    facts: [
      { year: 1917, text: "The main building was inaugurated in 1917, designed by architect Erik Lallerstedt in the National Romantic style." },
      { year: 1994, text: "Major renovation completed, modernizing lecture halls while preserving the iconic brick façade." },
    ],
  },
  {
    id: "reactor-r1",
    name: "Reactor R1",
    lat: 59.3481,
    lng: 18.0695,
    facts: [
      { year: 1954, text: "Sweden's first nuclear reactor R1 was built 25 meters underground beneath KTH campus." },
      { year: 1970, text: "Reactor R1 was decommissioned. The cavern is now used as a concert and event venue." },
    ],
  },
  {
    id: "kth-library",
    name: "KTH Library",
    lat: 59.3469,
    lng: 18.0711,
    facts: [
      { year: 1927, text: "The KTH Library was established as a dedicated facility to support the growing engineering programs." },
      { year: 2010, text: "The library underwent a digital transformation, becoming a hub for open-access research and innovation." },
    ],
  },
  {
    id: "nymble",
    name: "Nymble (Student Union)",
    lat: 59.3472,
    lng: 18.0703,
    facts: [
      { year: 1930, text: "Nymble, the student union building, was completed and became the heart of student life at KTH." },
      { year: 2004, text: "Nymble was extensively renovated and expanded, including the addition of new event spaces." },
    ],
  },
  {
    id: "sang-i-stansen",
    name: "Kårhuset / Sang i Stansen",
    lat: 59.3479,
    lng: 18.0738,
    facts: [
      { year: 1960, text: "The area became known for student performances and cultural gatherings during the 1960s." },
      { year: 2015, text: "New campus landscaping connected this area to the broader urban renewal of the Valhallavägen corridor." },
    ],
  },
  {
    id: "entry-arch",
    name: "KTH Entry Arch",
    lat: 59.3466,
    lng: 18.0720,
    facts: [
      { year: 1917, text: "The ceremonial entry arch was built as part of the original campus plan, symbolizing the gateway to knowledge." },
      { year: 2017, text: "KTH celebrated its 100th anniversary on the Valhallavägen campus with festivities at the arch." },
    ],
  },
];

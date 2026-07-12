import type { Period, TimelineItem } from "./data";

const event = (
  id: string,
  title: string,
  start: number,
  end: number,
  lane: TimelineItem["lane"],
  importance: TimelineItem["importance"],
  wikiTitle: string,
  summary: string,
  tags: string[] = [],
): TimelineItem => ({
  id,
  title,
  start,
  end,
  lane,
  kind: "event",
  importance,
  wikiTitle,
  summary,
  tags,
});

export const EXTRA_EVENTS: TimelineItem[] = [
  event("extra-parthenon", "Výstavba Parthenónu", -447, -432, "monuments", 5, "Parthenón", "Vrcholné dílo klasické řecké architektury.", ["starověk", "stavba"]),
  event("extra-pantheon", "Výstavba římského Pantheonu", 118, 128, "monuments", 4, "Pantheon (Řím)", "Jeden z nejlépe dochovaných chrámů antického Říma.", ["starověk", "stavba"]),
  event("extra-st-vitus", "Výstavba katedrály sv. Víta", 1344, 1929, "monuments", 5, "Katedrála svatého Víta, Václava a Vojtěcha", "Pražská katedrála budovaná od gotiky až do 20. století.", ["gotika", "stavba", "Česko"]),
  event("extra-st-barbara", "Výstavba chrámu sv. Barbory", 1388, 1905, "monuments", 4, "Chrám svaté Barbory", "Významný gotický chrám v Kutné Hoře.", ["gotika", "stavba", "Česko"]),
  event("extra-orloj", "Vznik pražského orloje", 1410, 1410, "monuments", 5, "Staroměstský orloj", "Jeden z nejstarších dochovaných astronomických orlojů na světě.", ["gotika", "věda", "Česko"]),
  event("extra-belveder", "Výstavba Letohrádku královny Anny", 1538, 1565, "monuments", 4, "Letohrádek královny Anny", "Renesanční stavba v areálu Pražského hradu.", ["renesance", "stavba", "Česko"]),
  event("extra-litomysl", "Renesanční přestavba zámku Litomyšl", 1568, 1581, "monuments", 4, "Zámek Litomyšl", "Významný český renesanční zámek.", ["renesance", "stavba", "Česko"]),
  event("extra-klementinum", "Výstavba barokního Klementina", 1653, 1726, "monuments", 4, "Klementinum", "Rozsáhlý barokní areál v Praze.", ["baroko", "stavba", "Česko"]),
  event("extra-kuks", "Výstavba areálu Kuks", 1694, 1724, "monuments", 4, "Kuks", "Barokní lázeňský a hospitalní komplex.", ["baroko", "stavba", "Česko"]),
  event("extra-st-nicholas", "Výstavba chrámu sv. Mikuláše", 1704, 1755, "monuments", 4, "Kostel svatého Mikuláše (Malá Strana)", "Vrcholná barokní stavba na Malé Straně.", ["baroko", "stavba", "Česko"]),
  event("extra-lednice", "Novogotická přestavba zámku Lednice", 1846, 1858, "monuments", 4, "Lednice (zámek)", "Romantická novogotická přestavba lednického zámku.", ["novogotika", "stavba", "Česko"]),
  event("extra-hluboka", "Novogotická přestavba zámku Hluboká", 1840, 1871, "monuments", 4, "Hluboká (zámek)", "Novogotická podoba zámku inspirovaná anglickou architekturou.", ["novogotika", "stavba", "Česko"]),
  event("extra-sagrada", "Výstavba chrámu Sagrada Família", 1882, 2026, "monuments", 4, "Sagrada Família", "Dlouhodobě budovaný chrám Antonia Gaudího v Barceloně.", ["moderní architektura", "stavba"]),
  event("extra-michelangelo", "Michelangelo Buonarroti", 1475, 1564, "figures", 5, "Michelangelo Buonarroti", "Renesanční sochař, malíř a architekt.", ["renesance", "umění"]),
  event("extra-gutenberg", "Johannes Gutenberg", 1400, 1468, "figures", 5, "Johannes Gutenberg", "Průkopník evropského knihtisku.", ["renesance", "knihtisk"]),
  event("extra-komensky", "Jan Amos Komenský", 1592, 1670, "figures", 5, "Jan Amos Komenský", "Český pedagog, filozof, teolog a spisovatel.", ["baroko", "pedagogika", "Česko"]),
  event("extra-luther", "Martin Luther", 1483, 1546, "figures", 5, "Martin Luther", "Teolog spojený se začátkem reformace.", ["reformace"]),
  event("extra-descartes", "René Descartes", 1596, 1650, "figures", 4, "René Descartes", "Filozof a matematik raného novověku.", ["filozofie", "věda"]),
  event("extra-vasco", "Vasco da Gama doplul do Indie", 1497, 1498, "world", 4, "Vasco da Gama", "Námořní cesta z Evropy do Indie kolem Afriky.", ["objev", "zámořské objevy"]),
  event("extra-magellan", "První obeplutí Země", 1519, 1522, "world", 5, "Magalhãesova expedice", "První doložená plavba kolem světa.", ["objev", "zámořské objevy"]),
];

export const EXTRA_PERIODS: Period[] = [
  { id: "roman-style", title: "Románský sloh", start: 1000, end: 1250, row: 1, scope: "world", color: "#9a7b53", wikiTitle: "Románský sloh" },
  { id: "gothic-style", title: "Gotika", start: 1150, end: 1500, row: 1, scope: "world", color: "#64789d", wikiTitle: "Gotika" },
  { id: "reformation-period", title: "Reformace", start: 1517, end: 1648, row: 1, scope: "world", color: "#9a5d4d", wikiTitle: "Reformace" },
  { id: "classicism", title: "Klasicismus", start: 1750, end: 1830, row: 1, scope: "world", color: "#a98b55", wikiTitle: "Klasicismus" },
  { id: "romanticism", title: "Romantismus", start: 1790, end: 1850, row: 1, scope: "world", color: "#7f628f", wikiTitle: "Romantismus" },
  { id: "modernism", title: "Moderna", start: 1890, end: 1945, row: 1, scope: "world", color: "#5f7f83", wikiTitle: "Moderna" },
];

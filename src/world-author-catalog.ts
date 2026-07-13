import {
  AUTHORS,
  DEFAULT_AUTHOR_IDS,
  WORKS,
  type TimelineItem,
} from "./data";

const CURRENT_YEAR = 2026;

const author = (
  id: string,
  title: string,
  start: number,
  end: number,
  wikiTitle: string,
  summary: string,
  living = false,
): TimelineItem => ({
  id,
  title,
  start,
  end,
  lane: "authors",
  kind: "author",
  importance: 5,
  summary,
  wikiTitle,
  living,
});

const work = (
  id: string,
  authorId: string,
  title: string,
  year: number,
  wikiTitle = title,
): TimelineItem => ({
  id,
  authorId,
  title,
  start: year,
  end: year,
  lane: "works",
  kind: "work",
  importance: 4,
  summary: "Známé literární dílo.",
  wikiTitle,
});

export const WORLD_AUTHOR_CATALOG: TimelineItem[] = [
  author("homer", "Homér", -750, -700, "Homér", "Starověký řecký básník tradičně spojovaný s Iliadou a Odysseou."),
  author("sappho", "Sapfó", -630, -570, "Sapfó", "Starověká řecká lyrická básnířka."),
  author("aeschylus", "Aischylos", -525, -456, "Aischylos", "Jeden z nejvýznamnějších autorů antické tragédie."),
  author("sophocles", "Sofoklés", -497, -406, "Sofoklés", "Řecký dramatik, autor tragédií Král Oidipus a Antigona."),
  author("euripides", "Eurípidés", -480, -406, "Eurípidés", "Řecký dramatik klasického období."),
  author("aristophanes", "Aristofanés", -446, -386, "Aristofanés", "Nejznámější autor starořecké komedie."),
  author("virgil", "Vergilius", -70, -19, "Publius Vergilius Maro", "Římský básník, autor Aeneidy."),
  author("horace", "Horatius", -65, -8, "Quintus Horatius Flaccus", "Římský lyrický básník a satirik."),
  author("ovid", "Ovidius", -43, 17, "Publius Ovidius Naso", "Římský básník, autor Proměn."),
  author("augustine", "Augustin z Hippa", 354, 430, "Augustin z Hippa", "Křesťanský filozof a autor Vyznání."),
  author("ferdowsi", "Firdausí", 940, 1020, "Firdausí", "Perský básník, autor eposu Šáhnáme."),
  author("murasaki", "Murasaki Šikibu", 973, 1014, "Murasaki Šikibu", "Japonská dvorní dáma a autorka Příběhu prince Gendžiho."),
  author("khayyam", "Omar Chajjám", 1048, 1131, "Omar Chajjám", "Perský básník, matematik a astronom."),
  author("dante", "Dante Alighieri", 1265, 1321, "Dante Alighieri", "Italský básník, autor Božské komedie."),
  author("petrarch", "Francesco Petrarca", 1304, 1374, "Francesco Petrarca", "Italský básník a představitel raného humanismu."),
  author("boccaccio", "Giovanni Boccaccio", 1313, 1375, "Giovanni Boccaccio", "Italský humanista a autor Dekameronu."),
  author("chaucer", "Geoffrey Chaucer", 1343, 1400, "Geoffrey Chaucer", "Anglický básník, autor Canterburských povídek."),
  author("villon", "François Villon", 1431, 1463, "François Villon", "Francouzský pozdně středověký básník."),
  author("machiavelli", "Niccolò Machiavelli", 1469, 1527, "Niccolò Machiavelli", "Renesanční politický myslitel a autor Vladaře."),
  author("rabelais", "François Rabelais", 1494, 1553, "François Rabelais", "Francouzský renesanční prozaik a humanista."),
  author("montaigne", "Michel de Montaigne", 1533, 1592, "Michel de Montaigne", "Francouzský myslitel, který proslavil literární esej."),
  author("lope-de-vega", "Lope de Vega", 1562, 1635, "Lope de Vega", "Španělský dramatik zlatého věku."),
  author("john-donne", "John Donne", 1572, 1631, "John Donne", "Anglický metafyzický básník."),
  author("milton", "John Milton", 1608, 1674, "John Milton", "Anglický básník, autor Ztraceného ráje."),
  author("racine", "Jean Racine", 1639, 1699, "Jean Racine", "Francouzský klasicistní dramatik."),
  author("basho", "Macuo Bašó", 1644, 1694, "Macuo Bašó", "Japonský básník a mistr haiku."),
  author("voltaire", "Voltaire", 1694, 1778, "Voltaire", "Francouzský osvícenský spisovatel a filozof."),
  author("rousseau", "Jean-Jacques Rousseau", 1712, 1778, "Jean-Jacques Rousseau", "Osvícenský filozof a spisovatel."),
  author("sterne", "Laurence Sterne", 1713, 1768, "Laurence Sterne", "Anglo-irský prozaik, autor Tristrama Shandyho."),
  author("diderot", "Denis Diderot", 1713, 1784, "Denis Diderot", "Francouzský osvícenec a spoluautor Encyklopedie."),
  author("william-blake", "William Blake", 1757, 1827, "William Blake", "Anglický básník, malíř a vizionář."),
  author("schiller", "Friedrich Schiller", 1759, 1805, "Friedrich Schiller", "Německý básník a dramatik."),
  author("walter-scott", "Walter Scott", 1771, 1832, "Walter Scott", "Skotský autor historických románů."),
  author("stendhal", "Stendhal", 1783, 1842, "Stendhal", "Francouzský romanopisec, autor Červeného a černého."),
  author("balzac", "Honoré de Balzac", 1799, 1850, "Honoré de Balzac", "Francouzský realista a autor Lidské komedie."),
  author("pushkin", "Alexandr Sergejevič Puškin", 1799, 1837, "Alexandr Sergejevič Puškin", "Ruský básník a prozaik."),
  author("dumas", "Alexandre Dumas starší", 1802, 1870, "Alexandre Dumas starší", "Francouzský autor dobrodružných románů."),
  author("gogol", "Nikolaj Vasiljevič Gogol", 1809, 1852, "Nikolaj Vasiljevič Gogol", "Rusko-ukrajinský prozaik a dramatik."),
  author("charlotte-bronte", "Charlotte Brontëová", 1816, 1855, "Charlotte Brontëová", "Anglická romanopiskyně, autorka Jany Eyrové."),
  author("emily-bronte", "Emily Brontëová", 1818, 1848, "Emily Brontëová", "Anglická básnířka a autorka Na Větrné hůrce."),
  author("melville", "Herman Melville", 1819, 1891, "Herman Melville", "Americký prozaik, autor Bílé velryby."),
  author("whitman", "Walt Whitman", 1819, 1892, "Walt Whitman", "Americký básník, autor Stébel trávy."),
  author("baudelaire", "Charles Baudelaire", 1821, 1867, "Charles Baudelaire", "Francouzský básník moderny."),
  author("flaubert", "Gustave Flaubert", 1821, 1880, "Gustave Flaubert", "Francouzský realista, autor Paní Bovaryové."),
  author("ibsen", "Henrik Ibsen", 1828, 1906, "Henrik Ibsen", "Norský dramatik moderního divadla."),
  author("conrad", "Joseph Conrad", 1857, 1924, "Joseph Conrad", "Anglicky píšící prozaik polského původu."),
  author("chekhov", "Anton Pavlovič Čechov", 1860, 1904, "Anton Pavlovič Čechov", "Ruský prozaik a dramatik."),
  author("tagore", "Rabíndranáth Thákur", 1861, 1941, "Rabíndranáth Thákur", "Bengálský básník a nositel Nobelovy ceny."),
  author("proust", "Marcel Proust", 1871, 1922, "Marcel Proust", "Francouzský modernistický romanopisec."),
  author("thomas-mann", "Thomas Mann", 1875, 1955, "Thomas Mann", "Německý prozaik a nositel Nobelovy ceny."),
  author("rilke", "Rainer Maria Rilke", 1875, 1926, "Rainer Maria Rilke", "Německy píšící básník narozený v Praze."),
  author("hesse", "Hermann Hesse", 1877, 1962, "Hermann Hesse", "Německo-švýcarský prozaik a básník."),
  author("joyce", "James Joyce", 1882, 1941, "James Joyce", "Irský modernistický prozaik."),
  author("agatha-christie", "Agatha Christie", 1890, 1976, "Agatha Christie", "Britská autorka detektivních románů."),
  author("bulgakov", "Michail Bulgakov", 1891, 1940, "Michail Afanasjevič Bulgakov", "Ruský prozaik a dramatik."),
  author("lorca", "Federico García Lorca", 1898, 1936, "Federico García Lorca", "Španělský básník a dramatik."),
  author("borges", "Jorge Luis Borges", 1899, 1986, "Jorge Luis Borges", "Argentinský prozaik, básník a esejista."),
  author("nabokov", "Vladimir Nabokov", 1899, 1977, "Vladimir Nabokov", "Rusko-americký romanopisec."),
  author("saint-exupery", "Antoine de Saint-Exupéry", 1900, 1944, "Antoine de Saint-Exupéry", "Francouzský spisovatel a letec."),
  author("salinger", "J. D. Salinger", 1919, 2010, "J. D. Salinger", "Americký prozaik, autor Kdo chytá v žitě."),
  author("bradbury", "Ray Bradbury", 1920, 2012, "Ray Bradbury", "Americký autor science fiction a fantasy."),
  author("lem", "Stanisław Lem", 1921, 2006, "Stanisław Lem", "Polský autor science fiction."),
  author("calvino", "Italo Calvino", 1923, 1985, "Italo Calvino", "Italský prozaik a experimentátor."),
  author("toni-morrison", "Toni Morrisonová", 1931, 2019, "Toni Morrison", "Americká romanopiskyně a nositelka Nobelovy ceny."),
  author("eco", "Umberto Eco", 1932, 2016, "Umberto Eco", "Italský sémiotik a romanopisec."),
  author("atwood", "Margaret Atwoodová", 1939, CURRENT_YEAR, "Margaret Atwood", "Kanadská spisovatelka a básnířka.", true),
  author("rushdie", "Salman Rushdie", 1947, CURRENT_YEAR, "Salman Rushdie", "Britsko-indický romanopisec.", true),
  author("ishiguro", "Kazuo Ishiguro", 1954, CURRENT_YEAR, "Kazuo Ishiguro", "Britský romanopisec a nositel Nobelovy ceny.", true),
  author("gaiman", "Neil Gaiman", 1960, CURRENT_YEAR, "Neil Gaiman", "Britský autor fantasy, komiksů a scénářů.", true),
  author("adichie", "Chimamanda Ngozi Adichie", 1977, CURRENT_YEAR, "Chimamanda Ngozi Adichie", "Nigerijská prozaička a esejistka.", true),
];

export const WORLD_WORK_CATALOG: TimelineItem[] = [
  work("iliad", "homer", "Ilias", -730, "Ilias"),
  work("odyssey", "homer", "Odysseia", -720, "Odysseia"),
  work("sappho-fragments", "sappho", "Sapfóiny básnické fragmenty", -600, "Sapfó"),
  work("oresteia", "aeschylus", "Oresteia", -458, "Oresteia"),
  work("oedipus", "sophocles", "Král Oidipus", -429, "Král Oidipus"),
  work("antigone", "sophocles", "Antigona", -441, "Antigona"),
  work("medea", "euripides", "Médeia", -431, "Médeia"),
  work("lysistrata", "aristophanes", "Lysistrata", -411, "Lysistrata"),
  work("aeneid", "virgil", "Aeneis", -19, "Aeneis"),
  work("horace-odes", "horace", "Ódy", -23, "Ódy (Horatius)"),
  work("metamorphoses", "ovid", "Proměny", 8, "Proměny (Ovidius)"),
  work("confessions-augustine", "augustine", "Vyznání", 400, "Vyznání (Augustin)"),
  work("shahnameh", "ferdowsi", "Šáhnáme", 1010, "Šáhnáme"),
  work("genji", "murasaki", "Příběh prince Gendžiho", 1010, "Příběh prince Gendžiho"),
  work("rubaiyat", "khayyam", "Rubáiját", 1100, "Rubáiját"),
  work("divine-comedy", "dante", "Božská komedie", 1321, "Božská komedie"),
  work("canzoniere", "petrarch", "Zpěvník", 1374, "Canzoniere"),
  work("decameron", "boccaccio", "Dekameron", 1353, "Dekameron"),
  work("canterbury", "chaucer", "Canterburské povídky", 1400, "Canterburské povídky"),
  work("villon-testament", "villon", "Velký testament", 1461, "Velký testament"),
  work("prince", "machiavelli", "Vladař", 1532, "Vladař"),
  work("gargantua", "rabelais", "Gargantua a Pantagruel", 1532, "Gargantua a Pantagruel"),
  work("essays-montaigne", "montaigne", "Eseje", 1580, "Eseje (Montaigne)"),
  work("fuenteovejuna", "lope-de-vega", "Fuente Ovejuna", 1619, "Fuente Ovejuna"),
  work("donne-poems", "john-donne", "Písně a sonety", 1633, "John Donne"),
  work("paradise-lost", "milton", "Ztracený ráj", 1667, "Ztracený ráj"),
  work("phaedra", "racine", "Faidra", 1677, "Faidra (Racine)"),
  work("narrow-road", "basho", "Úzká stezka do vnitrozemí", 1702, "Oku no Hosomiči"),
  work("candide", "voltaire", "Candide", 1759, "Candide"),
  work("social-contract", "rousseau", "O společenské smlouvě", 1762, "O společenské smlouvě"),
  work("tristram", "sterne", "Život a názory blahorodého pana Tristrama Shandyho", 1759, "Život a názory blahorodého pana Tristrama Shandyho"),
  work("rameau-nephew", "diderot", "Rameauův synovec", 1805, "Rameauův synovec"),
  work("songs-innocence", "william-blake", "Písně nevinnosti a zkušenosti", 1794, "Písně nevinnosti a zkušenosti"),
  work("robbers", "schiller", "Loupežníci", 1781, "Loupežníci (Schiller)"),
  work("ivanhoe", "walter-scott", "Ivanhoe", 1819, "Ivanhoe"),
  work("red-black", "stendhal", "Červený a černý", 1830, "Červený a černý"),
  work("father-goriot", "balzac", "Otec Goriot", 1835, "Otec Goriot"),
  work("eugene-onegin", "pushkin", "Evžen Oněgin", 1833, "Evžen Oněgin"),
  work("three-musketeers", "dumas", "Tři mušketýři", 1844, "Tři mušketýři"),
  work("dead-souls", "gogol", "Mrtvé duše", 1842, "Mrtvé duše"),
  work("jane-eyre", "charlotte-bronte", "Jana Eyrová", 1847, "Jana Eyrová"),
  work("wuthering", "emily-bronte", "Na Větrné hůrce", 1847, "Na Větrné hůrce"),
  work("moby-dick", "melville", "Bílá velryba", 1851, "Bílá velryba"),
  work("leaves-grass", "whitman", "Stébla trávy", 1855, "Stébla trávy"),
  work("flowers-evil", "baudelaire", "Květy zla", 1857, "Květy zla"),
  work("madame-bovary", "flaubert", "Paní Bovaryová", 1857, "Paní Bovaryová"),
  work("dolls-house", "ibsen", "Nora", 1879, "Nora (drama)"),
  work("heart-darkness", "conrad", "Srdce temnoty", 1899, "Srdce temnoty"),
  work("cherry-orchard", "chekhov", "Višňový sad", 1904, "Višňový sad"),
  work("gitanjali", "tagore", "Gítándžali", 1910, "Gítándžali"),
  work("lost-time", "proust", "Hledání ztraceného času", 1913, "Hledání ztraceného času"),
  work("magic-mountain", "thomas-mann", "Kouzelný vrch", 1924, "Kouzelný vrch"),
  work("duino", "rilke", "Elegie z Duina", 1923, "Elegie z Duina"),
  work("steppenwolf", "hesse", "Stepní vlk", 1927, "Stepní vlk"),
  work("ulysses", "joyce", "Odysseus", 1922, "Odysseus (Joyce)"),
  work("murder-orient", "agatha-christie", "Vražda v Orient expresu", 1934, "Vražda v Orient expresu"),
  work("master-margarita", "bulgakov", "Mistr a Markétka", 1967, "Mistr a Markétka"),
  work("blood-wedding", "lorca", "Krvavá svatba", 1933, "Krvavá svatba"),
  work("fictions", "borges", "Fikce", 1944, "Fikce (Borges)"),
  work("lolita", "nabokov", "Lolita", 1955, "Lolita"),
  work("little-prince", "saint-exupery", "Malý princ", 1943, "Malý princ"),
  work("catcher", "salinger", "Kdo chytá v žitě", 1951, "Kdo chytá v žitě"),
  work("fahrenheit", "bradbury", "451 stupňů Fahrenheita", 1953, "451 stupňů Fahrenheita"),
  work("solaris", "lem", "Solaris", 1961, "Solaris (román)"),
  work("invisible-cities", "calvino", "Neviditelná města", 1972, "Neviditelná města"),
  work("beloved", "toni-morrison", "Milovaná", 1987, "Milovaná (román)"),
  work("name-rose", "eco", "Jméno růže", 1980, "Jméno růže"),
  work("handmaids-tale", "atwood", "Příběh služebnice", 1985, "Příběh služebnice"),
  work("midnights-children", "rushdie", "Děti půlnoci", 1981, "Děti půlnoci"),
  work("remains-day", "ishiguro", "Soumrak dne", 1989, "Soumrak dne"),
  work("american-gods", "gaiman", "Američtí bohové", 2001, "Američtí bohové"),
  work("half-yellow-sun", "adichie", "Půl žlutého slunce", 2006, "Půl žlutého slunce"),
];

const pushUnique = (target: TimelineItem[], additions: TimelineItem[]) => {
  const ids = new Set(target.map((item) => item.id));
  additions.forEach((item) => {
    if (!ids.has(item.id)) {
      target.push(item);
      ids.add(item.id);
    }
  });
};

pushUnique(AUTHORS, WORLD_AUTHOR_CATALOG);
pushUnique(WORKS, WORLD_WORK_CATALOG);

export const WORLD_OVERVIEW_AUTHOR_IDS = [
  "dante",
  "chaucer",
  "shakespeare",
  "cervantes",
  "moliere",
  "voltaire",
  "goethe",
  "austen",
  "pushkin",
  "dostoevsky",
  "tolstoy",
  "kafka",
  "capek",
  "orwell",
  "marquez",
  "rowling",
];

const storageKey = "casovrstvy-redesign-authors-v2";
const migrationKey = "casovrstvy-public-author-catalog-v1";
try {
  if (localStorage.getItem(migrationKey) !== "true") {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    const current = Array.isArray(stored) ? stored : DEFAULT_AUTHOR_IDS;
    const merged = [...new Set([...current, ...WORLD_OVERVIEW_AUTHOR_IDS])];
    localStorage.setItem(storageKey, JSON.stringify(merged));
    localStorage.setItem(migrationKey, "true");
  }
} catch {
  // The catalog still works when browser storage is unavailable.
}

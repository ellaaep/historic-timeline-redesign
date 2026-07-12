export type CategoryId =
  | "people"
  | "works"
  | "rulers"
  | "history"
  | "inventions";

export interface Category {
  id: CategoryId;
  label: string;
  description: string;
  /** maps to a --chart-N token defined in index.css */
  chart: 1 | 2 | 3 | 4 | 5;
}

export interface Era {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
}

export interface TimelineEntry {
  id: string;
  category: CategoryId;
  title: string;
  subtitle: string;
  startYear: number;
  endYear?: number;
  location: string;
  summary: string;
  detail: string;
  tags: string[];
}

export const YEAR_MIN = 1400;
export const YEAR_MAX = 2025;

export const CATEGORIES: Category[] = [
  {
    id: "people",
    label: "People",
    description: "Writers, thinkers, scientists & artists",
    chart: 1,
  },
  {
    id: "works",
    label: "Works",
    description: "Books, art & landmark publications",
    chart: 5,
  },
  {
    id: "rulers",
    label: "Rulers & Leaders",
    description: "Monarchs, presidents & heads of state",
    chart: 4,
  },
  {
    id: "history",
    label: "History & Wars",
    description: "Wars, revolutions & turning points",
    chart: 2,
  },
  {
    id: "inventions",
    label: "Inventions",
    description: "Technology & scientific breakthroughs",
    chart: 3,
  },
];

export const ERAS: Era[] = [
  { id: "medieval", label: "Late Middle Ages", startYear: 1400, endYear: 1492 },
  { id: "renaissance", label: "Renaissance", startYear: 1492, endYear: 1600 },
  { id: "baroque", label: "Baroque", startYear: 1600, endYear: 1700 },
  { id: "enlightenment", label: "Enlightenment", startYear: 1700, endYear: 1789 },
  { id: "revolution", label: "Age of Revolution", startYear: 1789, endYear: 1848 },
  { id: "industrial", label: "Industrial Era", startYear: 1848, endYear: 1914 },
  { id: "worldwars", label: "World Wars", startYear: 1914, endYear: 1945 },
  { id: "modern", label: "Modern Era", startYear: 1945, endYear: 1991 },
  { id: "contemporary", label: "Contemporary", startYear: 1991, endYear: 2025 },
];

export const ENTRIES: TimelineEntry[] = [
  // People
  {
    id: "p-gutenberg",
    category: "people",
    title: "Johannes Gutenberg",
    subtitle: "1400 – 1468",
    startYear: 1400,
    endYear: 1468,
    location: "Mainz, Holy Roman Empire",
    summary: "Inventor of the movable-type printing press.",
    detail:
      "German goldsmith and printer whose movable-type press made books affordable and sparked an information revolution across Europe, laying the groundwork for the Reformation and the spread of literacy.",
    tags: ["printing", "invention", "Germany"],
  },
  {
    id: "p-davinci",
    category: "people",
    title: "Leonardo da Vinci",
    subtitle: "1452 – 1519",
    startYear: 1452,
    endYear: 1519,
    location: "Florence, Italy",
    summary: "Renaissance polymath, painter and engineer.",
    detail:
      "Painter, engineer, and scientist whose notebooks and works — the Mona Lisa, The Last Supper — embody the Renaissance ideal of uniting art and empirical observation.",
    tags: ["art", "science", "Italy"],
  },
  {
    id: "p-shakespeare",
    category: "people",
    title: "William Shakespeare",
    subtitle: "1564 – 1616",
    startYear: 1564,
    endYear: 1616,
    location: "Stratford-upon-Avon, England",
    summary: "Playwright and poet of the English Renaissance.",
    detail:
      "English playwright and poet widely regarded as the greatest writer in the English language, author of Hamlet, Macbeth, and 154 sonnets.",
    tags: ["literature", "theatre", "England"],
  },
  {
    id: "p-newton",
    category: "people",
    title: "Isaac Newton",
    subtitle: "1643 – 1727",
    startYear: 1643,
    endYear: 1727,
    location: "Woolsthorpe, England",
    summary: "Physicist who formalized the laws of motion.",
    detail:
      "English physicist and mathematician whose Principia Mathematica established classical mechanics and universal gravitation, founding modern physics.",
    tags: ["science", "physics", "England"],
  },
  {
    id: "p-mozart",
    category: "people",
    title: "Wolfgang A. Mozart",
    subtitle: "1756 – 1791",
    startYear: 1756,
    endYear: 1791,
    location: "Salzburg, Austria",
    summary: "Prolific Classical-era composer.",
    detail:
      "Austrian composer of the Classical era whose operas, symphonies, and concertos remain cornerstones of Western classical music.",
    tags: ["music", "Austria"],
  },
  {
    id: "p-curie",
    category: "people",
    title: "Marie Curie",
    subtitle: "1867 – 1934",
    startYear: 1867,
    endYear: 1934,
    location: "Warsaw / Paris",
    summary: "Pioneer of radioactivity research.",
    detail:
      "Polish-French physicist and chemist, the first person to win Nobel Prizes in two different sciences, for her research on radioactivity.",
    tags: ["science", "physics", "chemistry"],
  },
  {
    id: "p-einstein",
    category: "people",
    title: "Albert Einstein",
    subtitle: "1879 – 1955",
    startYear: 1879,
    endYear: 1955,
    location: "Ulm, Germany / Princeton, USA",
    summary: "Developed the theory of relativity.",
    detail:
      "Theoretical physicist whose theory of relativity reshaped our understanding of space, time, and gravity, and who won the 1921 Nobel Prize in Physics.",
    tags: ["science", "physics"],
  },
  {
    id: "p-mandela",
    category: "people",
    title: "Nelson Mandela",
    subtitle: "1918 – 2013",
    startYear: 1918,
    endYear: 2013,
    location: "South Africa",
    summary: "Anti-apartheid leader and first Black president of South Africa.",
    detail:
      "South African anti-apartheid revolutionary who spent 27 years imprisoned before becoming the country's first democratically elected president in 1994.",
    tags: ["politics", "civil rights", "South Africa"],
  },

  // Works
  {
    id: "w-42-lines",
    category: "works",
    title: "Gutenberg Bible",
    subtitle: "First printed Bible",
    startYear: 1455,
    location: "Mainz",
    summary: "First major book printed with movable type.",
    detail:
      "The 42-line Bible was the first substantial book printed in Europe using movable metal type, a landmark in the history of publishing.",
    tags: ["book", "printing"],
  },
  {
    id: "w-hamlet",
    category: "works",
    title: "Hamlet",
    subtitle: "Shakespeare's tragedy",
    startYear: 1600,
    location: "London",
    summary: "One of the most performed plays in history.",
    detail:
      "A tragedy exploring revenge, madness, and mortality, considered among the most influential works in the English language.",
    tags: ["theatre", "literature"],
  },
  {
    id: "w-principia",
    category: "works",
    title: "Principia Mathematica",
    subtitle: "Newton's laws of motion",
    startYear: 1687,
    location: "Cambridge",
    summary: "Foundational text of classical mechanics.",
    detail:
      "Newton's three-volume work laid out the laws of motion and universal gravitation, becoming the foundation of classical physics for centuries.",
    tags: ["science", "book"],
  },
  {
    id: "w-originofspecies",
    category: "works",
    title: "On the Origin of Species",
    subtitle: "Darwin's theory of evolution",
    startYear: 1859,
    location: "London",
    summary: "Introduced the theory of natural selection.",
    detail:
      "Charles Darwin's book introduced the scientific theory of evolution by natural selection, transforming biology and our understanding of life.",
    tags: ["science", "book"],
  },
  {
    id: "w-guernica",
    category: "works",
    title: "Guernica",
    subtitle: "Picasso's anti-war mural",
    startYear: 1937,
    location: "Paris",
    summary: "A searing response to the horrors of war.",
    detail:
      "Pablo Picasso's mural-sized painting depicts the suffering of civilians during the bombing of Guernica, becoming an enduring anti-war symbol.",
    tags: ["art", "war"],
  },
  {
    id: "w-www",
    category: "works",
    title: "The World Wide Web",
    subtitle: "First public proposal",
    startYear: 1991,
    location: "CERN, Switzerland",
    summary: "Made the internet accessible to everyone.",
    detail:
      "Tim Berners-Lee's proposal for a hypertext system became the World Wide Web, transforming how humanity shares information.",
    tags: ["technology", "internet"],
  },

  // Rulers & Leaders
  {
    id: "r-suleiman",
    category: "rulers",
    title: "Suleiman the Magnificent",
    subtitle: "Ottoman Sultan",
    startYear: 1520,
    endYear: 1566,
    location: "Ottoman Empire",
    summary: "Longest-reigning Ottoman sultan.",
    detail:
      "Under his reign the Ottoman Empire reached its cultural, military, and territorial peak, spanning three continents.",
    tags: ["empire", "monarchy"],
  },
  {
    id: "r-elizabeth1",
    category: "rulers",
    title: "Elizabeth I",
    subtitle: "Queen of England",
    startYear: 1558,
    endYear: 1603,
    location: "England",
    summary: "Presided over the English Renaissance.",
    detail:
      "Her 45-year reign — the Elizabethan era — saw the flourishing of English drama, the defeat of the Spanish Armada, and the expansion of English influence.",
    tags: ["monarchy", "England"],
  },
  {
    id: "r-louis14",
    category: "rulers",
    title: "Louis XIV",
    subtitle: "The Sun King",
    startYear: 1643,
    endYear: 1715,
    location: "France",
    summary: "Longest-reigning monarch in European history.",
    detail:
      "Centralized French royal power at Versailles and made France the dominant political and cultural force in Europe.",
    tags: ["monarchy", "France"],
  },
  {
    id: "r-napoleon",
    category: "rulers",
    title: "Napoleon Bonaparte",
    subtitle: "Emperor of the French",
    startYear: 1804,
    endYear: 1815,
    location: "France",
    summary: "Reshaped Europe's political map.",
    detail:
      "Rose from the French Revolution to conquer most of continental Europe, spreading revolutionary legal codes before his defeat at Waterloo.",
    tags: ["empire", "war", "France"],
  },
  {
    id: "r-victoria",
    category: "rulers",
    title: "Queen Victoria",
    subtitle: "Monarch of the British Empire",
    startYear: 1837,
    endYear: 1901,
    location: "United Kingdom",
    summary: "Presided over the height of British imperial power.",
    detail:
      "Her 63-year reign spanned rapid industrialization and the peak territorial extent of the British Empire.",
    tags: ["monarchy", "empire"],
  },
  {
    id: "r-fdr",
    category: "rulers",
    title: "Franklin D. Roosevelt",
    subtitle: "32nd US President",
    startYear: 1933,
    endYear: 1945,
    location: "United States",
    summary: "Led the US through the Depression and WWII.",
    detail:
      "Enacted the New Deal to combat the Great Depression and led the United States through most of the Second World War.",
    tags: ["politics", "war", "USA"],
  },

  // History & Wars
  {
    id: "h-constantinople",
    category: "history",
    title: "Fall of Constantinople",
    subtitle: "End of the Byzantine Empire",
    startYear: 1453,
    location: "Constantinople",
    summary: "Ottoman conquest reshapes the Mediterranean.",
    detail:
      "The Ottoman conquest of Constantinople ended the Byzantine Empire and marked a turning point between the medieval and early modern periods.",
    tags: ["war", "empire"],
  },
  {
    id: "h-reformation",
    category: "history",
    title: "Protestant Reformation",
    subtitle: "Luther's Ninety-five Theses",
    startYear: 1517,
    location: "Wittenberg",
    summary: "Splintered Western Christianity.",
    detail:
      "Martin Luther's challenge to the Catholic Church sparked a religious movement that permanently reshaped European politics and society.",
    tags: ["religion", "Europe"],
  },
  {
    id: "h-thirtyyears",
    category: "history",
    title: "Thirty Years' War",
    subtitle: "Devastating pan-European conflict",
    startYear: 1618,
    endYear: 1648,
    location: "Central Europe",
    summary: "One of the deadliest conflicts in European history.",
    detail:
      "A brutal religious and political war across the Holy Roman Empire that killed millions and redrew the European balance of power.",
    tags: ["war", "Europe"],
  },
  {
    id: "h-frenchrev",
    category: "history",
    title: "French Revolution",
    subtitle: "Fall of the ancien régime",
    startYear: 1789,
    endYear: 1799,
    location: "France",
    summary: "Overthrew the monarchy, redefined citizenship.",
    detail:
      "A decade of upheaval that toppled the French monarchy, introduced the Declaration of the Rights of Man, and inspired revolutionary movements worldwide.",
    tags: ["revolution", "France"],
  },
  {
    id: "h-ww1",
    category: "history",
    title: "First World War",
    subtitle: "The Great War",
    startYear: 1914,
    endYear: 1918,
    location: "Europe & beyond",
    summary: "Redrew borders and ended empires.",
    detail:
      "A global conflict that killed millions, toppled empires, and set the stage for the political upheavals of the 20th century.",
    tags: ["war", "global"],
  },
  {
    id: "h-ww2",
    category: "history",
    title: "Second World War",
    subtitle: "Global conflict, 1939–1945",
    startYear: 1939,
    endYear: 1945,
    location: "Global",
    summary: "The deadliest conflict in human history.",
    detail:
      "A war spanning nearly every continent that reshaped the global order and led directly to the founding of the United Nations.",
    tags: ["war", "global"],
  },
  {
    id: "h-berlinwall",
    category: "history",
    title: "Fall of the Berlin Wall",
    subtitle: "End of the Cold War divide",
    startYear: 1989,
    location: "Berlin",
    summary: "Symbolic end of the Cold War era.",
    detail:
      "The dismantling of the Berlin Wall symbolized the collapse of Soviet influence in Eastern Europe and the reunification of Germany.",
    tags: ["politics", "Germany"],
  },

  // Inventions
  {
    id: "i-printingpress",
    category: "inventions",
    title: "Printing Press",
    subtitle: "Movable-type printing",
    startYear: 1440,
    location: "Mainz",
    summary: "Made mass-produced books possible.",
    detail:
      "Gutenberg's movable-type press revolutionized the spread of knowledge, making books dramatically cheaper and more widely available.",
    tags: ["printing", "media"],
  },
  {
    id: "i-telescope",
    category: "inventions",
    title: "Telescope",
    subtitle: "Galileo's astronomical observations",
    startYear: 1608,
    location: "Netherlands / Italy",
    summary: "Opened the door to modern astronomy.",
    detail:
      "Refined by Galileo Galilei for astronomical use, the telescope revealed moons, planets, and stars invisible to the naked eye.",
    tags: ["science", "astronomy"],
  },
  {
    id: "i-steamengine",
    category: "inventions",
    title: "Steam Engine",
    subtitle: "Watt's improved design",
    startYear: 1769,
    location: "Scotland",
    summary: "Powered the Industrial Revolution.",
    detail:
      "James Watt's improvements to the steam engine made industrial-scale manufacturing and rail transport possible, igniting the Industrial Revolution.",
    tags: ["technology", "industry"],
  },
  {
    id: "i-electriclight",
    category: "inventions",
    title: "Electric Light Bulb",
    subtitle: "Practical incandescent lighting",
    startYear: 1879,
    location: "USA",
    summary: "Brought reliable light to homes and cities.",
    detail:
      "Thomas Edison's commercially viable light bulb made electric lighting practical for households, transforming daily life and industry.",
    tags: ["technology", "electricity"],
  },
  {
    id: "i-penicillin",
    category: "inventions",
    title: "Penicillin",
    subtitle: "First modern antibiotic",
    startYear: 1928,
    location: "London",
    summary: "Launched the age of antibiotics.",
    detail:
      "Alexander Fleming's discovery of penicillin's antibacterial properties led to the development of antibiotics, saving countless lives.",
    tags: ["science", "medicine"],
  },
  {
    id: "i-internet",
    category: "inventions",
    title: "Internet (ARPANET)",
    subtitle: "First packet-switching network",
    startYear: 1969,
    location: "USA",
    summary: "The precursor to the modern internet.",
    detail:
      "ARPANET connected computers across US research institutions using packet switching, becoming the technical ancestor of today's internet.",
    tags: ["technology", "internet"],
  },
  {
    id: "i-smartphone",
    category: "inventions",
    title: "iPhone",
    subtitle: "Modern smartphone era begins",
    startYear: 2007,
    location: "USA",
    summary: "Redefined personal computing and communication.",
    detail:
      "Apple's iPhone combined a phone, computer, and camera into a single touchscreen device, launching the modern smartphone era.",
    tags: ["technology"],
  },
];

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

export function getEntry(id: string): TimelineEntry | undefined {
  return ENTRIES.find((e) => e.id === id);
}

export function getRelatedEntries(entry: TimelineEntry, limit = 4): TimelineEntry[] {
  return ENTRIES.filter(
    (e) =>
      e.id !== entry.id &&
      (e.category === entry.category ||
        Math.abs(e.startYear - entry.startYear) <= 40)
  )
    .sort((a, b) => Math.abs(a.startYear - entry.startYear) - Math.abs(b.startYear - entry.startYear))
    .slice(0, limit);
}

export function getEraForYear(year: number): Era | undefined {
  return ERAS.find((e) => year >= e.startYear && year < e.endYear) ?? ERAS[ERAS.length - 1];
}

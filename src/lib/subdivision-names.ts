/**
 * Complete subdivision overrides for countries where `country-state-city`
 * provides unreliable data (wrong ISO codes, mixed granularity, etc.).
 *
 * When a country is listed here its subdivisions are used directly instead of
 * querying the package. The `code` must match the ISO 3166-2 format used by
 * the public holidays API (e.g. ES-MD, ES-CT).
 */
export const SUBDIVISION_OVERRIDES: Record<
  string,
  { code: string; name: string }[]
> = {
  // The package mixes autonomous communities with individual provinces and
  // uses non-standard codes for Spain. We provide the canonical list of
  // autonomous communities that matches the nager.date holiday API.
  ES: [
    { code: "ES-AN", name: "Andalucía" },
    { code: "ES-AR", name: "Aragón" },
    { code: "ES-AS", name: "Asturias" },
    { code: "ES-IB", name: "Islas Baleares" },
    { code: "ES-CN", name: "Islas Canarias" },
    { code: "ES-CB", name: "Cantabria" },
    { code: "ES-CL", name: "Castilla y León" },
    { code: "ES-CM", name: "Castilla-La Mancha" },
    { code: "ES-CT", name: "Cataluña" },
    { code: "ES-EX", name: "Extremadura" },
    { code: "ES-GA", name: "Galicia" },
    { code: "ES-MD", name: "Madrid" },
    { code: "ES-MC", name: "Murcia" },
    { code: "ES-NC", name: "Navarra" },
    { code: "ES-PV", name: "País Vasco" },
    { code: "ES-RI", name: "La Rioja" },
    { code: "ES-VC", name: "Comunidad Valenciana" },
    { code: "ES-CE", name: "Ceuta" },
    { code: "ES-ML", name: "Melilla" },
  ],
};

/**
 * Localized name translations for country subdivisions.
 * Only needed for countries NOT listed in SUBDIVISION_OVERRIDES.
 * Keys are ISO 3166-1 Alpha-2 country codes.
 * Values are maps of subdivision isoCode → local name.
 *
 * Countries not listed fall back to the English name from the package.
 */
export const SUBDIVISION_NAMES: Record<string, Record<string, string>> = {
  PT: {
    "01": "Aveiro",
    "02": "Beja",
    "03": "Braga",
    "04": "Bragança",
    "05": "Castelo Branco",
    "06": "Coimbra",
    "07": "Évora",
    "08": "Faro",
    "09": "Guarda",
    "10": "Leiria",
    "11": "Lisboa",
    "12": "Portalegre",
    "13": "Porto",
    "14": "Santarém",
    "15": "Setúbal",
    "16": "Viana do Castelo",
    "17": "Vila Real",
    "18": "Viseu",
    "20": "Região Autónoma dos Açores",
    "30": "Região Autónoma da Madeira",
  },
  FR: {
    ARA: "Auvergne-Rhône-Alpes",
    BFC: "Bourgogne-Franche-Comté",
    BRE: "Bretagne",
    CVL: "Centre-Val de Loire",
    COR: "Corse",
    GES: "Grand Est",
    HDF: "Hauts-de-France",
    IDF: "Île-de-France",
    NOR: "Normandie",
    NAQ: "Nouvelle-Aquitaine",
    OCC: "Occitanie",
    PDL: "Pays de la Loire",
    PAC: "Provence-Alpes-Côte d'Azur",
  },
  DE: {
    BW: "Baden-Württemberg",
    BY: "Bayern",
    BE: "Berlin",
    BB: "Brandenburg",
    HB: "Bremen",
    HH: "Hamburg",
    HE: "Hessen",
    MV: "Mecklenburg-Vorpommern",
    NI: "Niedersachsen",
    NW: "Nordrhein-Westfalen",
    RP: "Rheinland-Pfalz",
    SL: "Saarland",
    SN: "Sachsen",
    ST: "Sachsen-Anhalt",
    SH: "Schleswig-Holstein",
    TH: "Thüringen",
  },
};

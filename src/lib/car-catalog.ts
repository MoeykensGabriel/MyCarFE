export const CAR_CATALOG: Record<string, string[]> = {
  // ── Pickups ────────────────────────────────────────────────────────────────
  Toyota:          ["Hilux", "Hilux SRX", "Hilux SRV", "Hilux SR", "Etios", "Yaris", "Corolla", "RAV4", "SW4"],
  Volkswagen:      ["Amarok", "Amarok Highline", "Amarok Trendline", "Polo", "Gol", "Virtus", "Vento", "Tiguan", "T-Cross"],
  Ford:            ["Ranger", "Ranger XLT", "Ranger Limited", "Ranger XLS", "Transit", "Transit Custom", "Focus", "Ka", "EcoSport", "Territory"],
  Nissan:          ["Frontier", "Frontier LE", "Frontier SE", "Kicks", "Versa", "March", "Sentra"],

  // ── Utilitarios y furgones ─────────────────────────────────────────────────
  Renault:         ["Kangoo", "Kangoo Furgón", "Kangoo Express", "Sandero", "Logan", "Duster", "Oroch", "Kwid", "Captur"],
  Peugeot:         ["Partner", "Partner Furgón", "208", "308", "2008", "3008", "Landtrek"],
  Citroën:         ["Berlingo", "Berlingo Furgón", "C3", "C4", "C-Elysée", "Jumper"],
  "Mercedes-Benz": ["Sprinter", "Sprinter Furgón", "Sprinter Minibus", "Accelo", "Actros", "Vito", "Clase A", "Clase C", "GLA", "GLC"],

  // ── Sedanes y hatchbacks ───────────────────────────────────────────────────
  Fiat:            ["Cronos", "Cronos Drive", "Cronos Precision", "Pulse", "Fastback", "Mobi", "Uno", "Toro", "Strada", "Ducato", "Fiorino"],
  Chevrolet:       ["Onix", "Onix Plus", "Tracker", "S10", "Spin", "Cruze", "Montana", "Cobalt"],
  Honda:           ["Civic", "HR-V", "CR-V", "City", "WR-V", "Fit"],
  Hyundai:         ["HB20", "Creta", "Tucson", "Santa Fe", "Elantra", "Venue"],
  Kia:             ["Sportage", "Seltos", "Cerato", "Picanto", "Carnival"],

  // ── Camiones livianos y pesados ────────────────────────────────────────────
  Iveco:           ["Daily", "Daily Furgón", "Daily Minibus", "Tector", "Stralis", "Hi-Road", "S-Way"],
  Scania:          ["R 450", "R 500", "G 410", "P 310", "P 360"],
  Volvo:           ["FH 460", "FH 500", "FM 370", "VM 270", "VM 330"],
  "Man":           ["TGX", "TGS", "TGL", "TGM"],
  Agrale:          ["MT 6000", "MT 9000", "Marruá"],

  // ── Otros frecuentes en talleres ──────────────────────────────────────────
  Jeep:            ["Renegade", "Compass", "Grand Cherokee", "Wrangler"],
  Mitsubishi:      ["L200", "Outlander", "ASX", "Eclipse Cross"],
  Subaru:          ["Impreza", "Forester", "Outback", "XV"],
  Suzuki:          ["Vitara", "Swift", "Jimny", "S-Cross"],
  Chery:           ["Tiggo 2", "Tiggo 4", "Tiggo 7", "Arrizo 5"],
  BYD:             ["Dolphin", "Atto 3", "Seal", "Tang"],
};

export const BRANDS = Object.keys(CAR_CATALOG).sort();

export function getModels(brand: string): string[] {
  return CAR_CATALOG[brand] ?? [];
}

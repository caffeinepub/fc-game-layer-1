import { useEffect, useRef, useState } from "react";
import {
  type OwnedCard,
  addCardsToCollection,
  addCoins,
  addGems,
  deductGems,
  getChallenges,
  getCollection,
  getGems,
  getPackOpensToday,
  getWeeklyChallenges,
  incrementPackOpens,
  saveChallenges,
  saveWeeklyChallenges,
} from "./storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Rarity = "common" | "rare" | "epic" | "legendary";
export type Position =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LW"
  | "RW"
  | "ST"
  | "CF";

export interface PlayerCard {
  id: string;
  name: string;
  position: Position;
  ovr: number;
  rarity: Rarity;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  team: string;
  nation: string;
}

interface PackDef {
  id: string;
  name: string;
  cost: number;
  cards: number;
  dropRates: { common: number; rare: number; epic: number; legendary: number };
  emoji: string;
  accent: string;
}

// OwnedCard imported from storage

// ─── Card Data ───────────────────────────────────────────────────────────────

export const ALL_CARDS: PlayerCard[] = [
  // Common (OVR 60-72)
  {
    id: "c01",
    name: "Marco Bellini",
    position: "CB",
    ovr: 62,
    rarity: "common",
    pac: 55,
    sho: 35,
    pas: 52,
    dri: 48,
    def: 63,
    phy: 66,
    team: "FC Riviera",
    nation: "Italy",
  },
  {
    id: "c02",
    name: "Luis Torrado",
    position: "LB",
    ovr: 64,
    rarity: "common",
    pac: 65,
    sho: 38,
    pas: 58,
    dri: 55,
    def: 64,
    phy: 62,
    team: "SD Almeria B",
    nation: "Spain",
  },
  {
    id: "c03",
    name: "Pierre Dufour",
    position: "CM",
    ovr: 66,
    rarity: "common",
    pac: 60,
    sho: 52,
    pas: 68,
    dri: 62,
    def: 55,
    phy: 60,
    team: "AS Nordique",
    nation: "France",
  },
  {
    id: "c04",
    name: "Tomasz Wiśnik",
    position: "ST",
    ovr: 68,
    rarity: "common",
    pac: 70,
    sho: 67,
    pas: 52,
    dri: 63,
    def: 30,
    phy: 65,
    team: "Wisla Kraków II",
    nation: "Poland",
  },
  {
    id: "c05",
    name: "Erik Lindqvist",
    position: "GK",
    ovr: 61,
    rarity: "common",
    pac: 45,
    sho: 15,
    pas: 44,
    dri: 42,
    def: 60,
    phy: 65,
    team: "Djurgårdens IF B",
    nation: "Sweden",
  },
  {
    id: "c06",
    name: "Mateus Carvalho",
    position: "RB",
    ovr: 63,
    rarity: "common",
    pac: 67,
    sho: 42,
    pas: 56,
    dri: 57,
    def: 62,
    phy: 61,
    team: "FC Porto III",
    nation: "Portugal",
  },
  {
    id: "c07",
    name: "Adama Diallo",
    position: "CDM",
    ovr: 65,
    rarity: "common",
    pac: 62,
    sho: 44,
    pas: 60,
    dri: 58,
    def: 66,
    phy: 70,
    team: "AS Dakar",
    nation: "Senegal",
  },
  {
    id: "c08",
    name: "Jakub Novák",
    position: "LW",
    ovr: 67,
    rarity: "common",
    pac: 74,
    sho: 60,
    pas: 62,
    dri: 69,
    def: 35,
    phy: 56,
    team: "Sparta Praha C",
    nation: "Czech Republic",
  },
  {
    id: "c09",
    name: "Noel Brennan",
    position: "CAM",
    ovr: 69,
    rarity: "common",
    pac: 63,
    sho: 61,
    pas: 70,
    dri: 70,
    def: 38,
    phy: 57,
    team: "Shamrock Rovers B",
    nation: "Ireland",
  },
  {
    id: "c10",
    name: "Carlos Mendez",
    position: "RW",
    ovr: 70,
    rarity: "common",
    pac: 75,
    sho: 63,
    pas: 64,
    dri: 71,
    def: 36,
    phy: 58,
    team: "Cruz Azul B",
    nation: "Mexico",
  },
  {
    id: "c11",
    name: "Dragan Petković",
    position: "CB",
    ovr: 71,
    rarity: "common",
    pac: 52,
    sho: 33,
    pas: 54,
    dri: 46,
    def: 71,
    phy: 73,
    team: "Red Star U21",
    nation: "Serbia",
  },
  {
    id: "c12",
    name: "Mohamed Touré",
    position: "ST",
    ovr: 72,
    rarity: "common",
    pac: 72,
    sho: 70,
    pas: 54,
    dri: 65,
    def: 28,
    phy: 68,
    team: "ASEC Mimosas",
    nation: "Ivory Coast",
  },
  {
    id: "c13",
    name: "Ryan O'Sullivan",
    position: "CM",
    ovr: 62,
    rarity: "common",
    pac: 59,
    sho: 50,
    pas: 66,
    dri: 60,
    def: 57,
    phy: 62,
    team: "Cork City B",
    nation: "Ireland",
  },
  {
    id: "c14",
    name: "Stefan Müller",
    position: "GK",
    ovr: 64,
    rarity: "common",
    pac: 46,
    sho: 14,
    pas: 46,
    dri: 44,
    def: 63,
    phy: 67,
    team: "Schalke 04 U23",
    nation: "Germany",
  },
  {
    id: "c15",
    name: "Alberto Rivas",
    position: "CF",
    ovr: 66,
    rarity: "common",
    pac: 68,
    sho: 65,
    pas: 60,
    dri: 66,
    def: 27,
    phy: 61,
    team: "Atletico Bilbao B",
    nation: "Spain",
  },
  {
    id: "c16",
    name: "Yannick Kouassi",
    position: "LB",
    ovr: 68,
    rarity: "common",
    pac: 69,
    sho: 40,
    pas: 60,
    dri: 59,
    def: 66,
    phy: 64,
    team: "ASSE B",
    nation: "France",
  },
  {
    id: "c17",
    name: "Petr Horáček",
    position: "CDM",
    ovr: 70,
    rarity: "common",
    pac: 63,
    sho: 46,
    pas: 62,
    dri: 60,
    def: 69,
    phy: 72,
    team: "Slavia Praha B",
    nation: "Czech Republic",
  },
  {
    id: "c18",
    name: "Gabriel Soares",
    position: "RB",
    ovr: 71,
    rarity: "common",
    pac: 70,
    sho: 44,
    pas: 58,
    dri: 61,
    def: 70,
    phy: 63,
    team: "Benfica U23",
    nation: "Portugal",
  },
  {
    id: "c19",
    name: "Kwame Asante",
    position: "ST",
    ovr: 63,
    rarity: "common",
    pac: 73,
    sho: 62,
    pas: 51,
    dri: 62,
    def: 25,
    phy: 67,
    team: "Hearts of Oak",
    nation: "Ghana",
  },
  {
    id: "c20",
    name: "Filippo Conti",
    position: "CAM",
    ovr: 65,
    rarity: "common",
    pac: 61,
    sho: 59,
    pas: 68,
    dri: 68,
    def: 36,
    phy: 55,
    team: "Fiorentina B",
    nation: "Italy",
  },
  {
    id: "c21",
    name: "Lasse Bergmann",
    position: "LW",
    ovr: 67,
    rarity: "common",
    pac: 73,
    sho: 58,
    pas: 61,
    dri: 68,
    def: 34,
    phy: 55,
    team: "Hamburger SV B",
    nation: "Germany",
  },
  {
    id: "c22",
    name: "Patrick Nzinga",
    position: "CB",
    ovr: 69,
    rarity: "common",
    pac: 54,
    sho: 34,
    pas: 55,
    dri: 49,
    def: 69,
    phy: 74,
    team: "TP Mazembe B",
    nation: "DR Congo",
  },
  {
    id: "c23",
    name: "Sebastián Quiroga",
    position: "CM",
    ovr: 71,
    rarity: "common",
    pac: 61,
    sho: 54,
    pas: 70,
    dri: 64,
    def: 56,
    phy: 63,
    team: "River Plate B",
    nation: "Argentina",
  },
  {
    id: "c24",
    name: "Ivan Petrenko",
    position: "RW",
    ovr: 72,
    rarity: "common",
    pac: 76,
    sho: 64,
    pas: 63,
    dri: 72,
    def: 37,
    phy: 57,
    team: "Dynamo Kyiv B",
    nation: "Ukraine",
  },
  {
    id: "c25",
    name: "Théo Marchais",
    position: "GK",
    ovr: 60,
    rarity: "common",
    pac: 44,
    sho: 12,
    pas: 43,
    dri: 40,
    def: 59,
    phy: 63,
    team: "Stade de Reims B",
    nation: "France",
  },
  {
    id: "c26",
    name: "Okan Yilmaz",
    position: "CDM",
    ovr: 68,
    rarity: "common",
    pac: 64,
    sho: 48,
    pas: 63,
    dri: 61,
    def: 67,
    phy: 71,
    team: "Galatasaray U21",
    nation: "Turkey",
  },
  {
    id: "c27",
    name: "Javier Estrada",
    position: "CF",
    ovr: 70,
    rarity: "common",
    pac: 71,
    sho: 68,
    pas: 61,
    dri: 67,
    def: 26,
    phy: 62,
    team: "Boca Juniors B",
    nation: "Argentina",
  },
  {
    id: "c28",
    name: "Nicolás Farías",
    position: "LB",
    ovr: 65,
    rarity: "common",
    pac: 67,
    sho: 39,
    pas: 59,
    dri: 57,
    def: 65,
    phy: 63,
    team: "Nacional B",
    nation: "Uruguay",
  },
  {
    id: "c29",
    name: "Boubacar Diarra",
    position: "ST",
    ovr: 67,
    rarity: "common",
    pac: 74,
    sho: 65,
    pas: 52,
    dri: 64,
    def: 27,
    phy: 69,
    team: "Stade Malien",
    nation: "Mali",
  },
  {
    id: "c30",
    name: "Henrik Aaberg",
    position: "CB",
    ovr: 69,
    rarity: "common",
    pac: 53,
    sho: 32,
    pas: 53,
    dri: 47,
    def: 70,
    phy: 72,
    team: "Brøndby IF B",
    nation: "Denmark",
  },

  // Rare (OVR 73-82)
  {
    id: "r01",
    name: "Luca Ferretti",
    position: "CM",
    ovr: 74,
    rarity: "rare",
    pac: 70,
    sho: 65,
    pas: 76,
    dri: 73,
    def: 62,
    phy: 68,
    team: "Juventus B",
    nation: "Italy",
  },
  {
    id: "r02",
    name: "Andrés Castellano",
    position: "ST",
    ovr: 76,
    rarity: "rare",
    pac: 78,
    sho: 76,
    pas: 62,
    dri: 74,
    def: 32,
    phy: 72,
    team: "Sevilla FC",
    nation: "Spain",
  },
  {
    id: "r03",
    name: "Maxime Renard",
    position: "CAM",
    ovr: 78,
    rarity: "rare",
    pac: 74,
    sho: 72,
    pas: 79,
    dri: 78,
    def: 44,
    phy: 64,
    team: "Olympique Lyon",
    nation: "France",
  },
  {
    id: "r04",
    name: "Tiago Ferreira",
    position: "RB",
    ovr: 75,
    rarity: "rare",
    pac: 78,
    sho: 55,
    pas: 70,
    dri: 72,
    def: 76,
    phy: 70,
    team: "Sporting CP",
    nation: "Portugal",
  },
  {
    id: "r05",
    name: "Christoph Bauer",
    position: "GK",
    ovr: 77,
    rarity: "rare",
    pac: 58,
    sho: 18,
    pas: 62,
    dri: 55,
    def: 77,
    phy: 78,
    team: "Borussia Mönchengladbach",
    nation: "Germany",
  },
  {
    id: "r06",
    name: "Emre Demir",
    position: "LW",
    ovr: 79,
    rarity: "rare",
    pac: 84,
    sho: 74,
    pas: 72,
    dri: 81,
    def: 42,
    phy: 62,
    team: "Galatasaray",
    nation: "Turkey",
  },
  {
    id: "r07",
    name: "Olivier Blanc",
    position: "CB",
    ovr: 80,
    rarity: "rare",
    pac: 64,
    sho: 42,
    pas: 65,
    dri: 58,
    def: 80,
    phy: 82,
    team: "AS Monaco",
    nation: "France",
  },
  {
    id: "r08",
    name: "Felipe Rojas",
    position: "CDM",
    ovr: 73,
    rarity: "rare",
    pac: 70,
    sho: 52,
    pas: 68,
    dri: 67,
    def: 74,
    phy: 78,
    team: "Universidad de Chile",
    nation: "Chile",
  },
  {
    id: "r09",
    name: "Mikael Sörensen",
    position: "CM",
    ovr: 75,
    rarity: "rare",
    pac: 72,
    sho: 67,
    pas: 77,
    dri: 74,
    def: 63,
    phy: 70,
    team: "Malmö FF",
    nation: "Sweden",
  },
  {
    id: "r10",
    name: "Diego Varela",
    position: "CF",
    ovr: 77,
    rarity: "rare",
    pac: 80,
    sho: 77,
    pas: 70,
    dri: 76,
    def: 30,
    phy: 71,
    team: "Atletico Nacional",
    nation: "Colombia",
  },
  {
    id: "r11",
    name: "Artur Kowalski",
    position: "RW",
    ovr: 79,
    rarity: "rare",
    pac: 85,
    sho: 73,
    pas: 73,
    dri: 80,
    def: 40,
    phy: 63,
    team: "Lech Poznań",
    nation: "Poland",
  },
  {
    id: "r12",
    name: "Vincenzo Palma",
    position: "ST",
    ovr: 81,
    rarity: "rare",
    pac: 82,
    sho: 81,
    pas: 66,
    dri: 78,
    def: 31,
    phy: 74,
    team: "SSC Napoli B",
    nation: "Italy",
  },
  {
    id: "r13",
    name: "Hassan Al-Farsi",
    position: "CM",
    ovr: 74,
    rarity: "rare",
    pac: 71,
    sho: 64,
    pas: 76,
    dri: 72,
    def: 64,
    phy: 67,
    team: "Al-Hilal B",
    nation: "Saudi Arabia",
  },
  {
    id: "r14",
    name: "Nathan Wright",
    position: "LB",
    ovr: 76,
    rarity: "rare",
    pac: 80,
    sho: 57,
    pas: 72,
    dri: 74,
    def: 77,
    phy: 71,
    team: "Manchester City B",
    nation: "England",
  },
  {
    id: "r15",
    name: "Rodrigo Nascimento",
    position: "CAM",
    ovr: 78,
    rarity: "rare",
    pac: 75,
    sho: 73,
    pas: 80,
    dri: 79,
    def: 45,
    phy: 65,
    team: "Flamengo",
    nation: "Brazil",
  },
  {
    id: "r16",
    name: "Julius Obi",
    position: "CDM",
    ovr: 80,
    rarity: "rare",
    pac: 73,
    sho: 55,
    pas: 71,
    dri: 70,
    def: 80,
    phy: 83,
    team: "Enyimba FC",
    nation: "Nigeria",
  },
  {
    id: "r17",
    name: "Emil Kristoffersen",
    position: "GK",
    ovr: 82,
    rarity: "rare",
    pac: 62,
    sho: 19,
    pas: 66,
    dri: 58,
    def: 82,
    phy: 83,
    team: "Rosenborg BK",
    nation: "Norway",
  },
  {
    id: "r18",
    name: "Renato Alves",
    position: "ST",
    ovr: 76,
    rarity: "rare",
    pac: 79,
    sho: 75,
    pas: 63,
    dri: 73,
    def: 29,
    phy: 73,
    team: "Palmeiras B",
    nation: "Brazil",
  },

  // Epic (OVR 83-90)
  {
    id: "e01",
    name: "Alessandro Greco",
    position: "CAM",
    ovr: 84,
    rarity: "epic",
    pac: 80,
    sho: 81,
    pas: 86,
    dri: 86,
    def: 50,
    phy: 70,
    team: "AC Milan",
    nation: "Italy",
  },
  {
    id: "e02",
    name: "Rafael Domínguez",
    position: "ST",
    ovr: 86,
    rarity: "epic",
    pac: 87,
    sho: 87,
    pas: 73,
    dri: 84,
    def: 34,
    phy: 79,
    team: "Real Madrid B",
    nation: "Spain",
  },
  {
    id: "e03",
    name: "Cédric Laurent",
    position: "CB",
    ovr: 88,
    rarity: "epic",
    pac: 74,
    sho: 48,
    pas: 74,
    dri: 68,
    def: 89,
    phy: 88,
    team: "Paris Saint-Germain",
    nation: "France",
  },
  {
    id: "e04",
    name: "Bruno Tavares",
    position: "LW",
    ovr: 85,
    rarity: "epic",
    pac: 91,
    sho: 82,
    pas: 79,
    dri: 88,
    def: 45,
    phy: 69,
    team: "Benfica",
    nation: "Portugal",
  },
  {
    id: "e05",
    name: "Lukas Hoffmann",
    position: "CM",
    ovr: 83,
    rarity: "epic",
    pac: 78,
    sho: 74,
    pas: 84,
    dri: 82,
    def: 70,
    phy: 77,
    team: "Bayern München",
    nation: "Germany",
  },
  {
    id: "e06",
    name: "Musa Ibrahim",
    position: "RW",
    ovr: 87,
    rarity: "epic",
    pac: 93,
    sho: 83,
    pas: 78,
    dri: 89,
    def: 42,
    phy: 68,
    team: "Al-Nassr",
    nation: "Nigeria",
  },
  {
    id: "e07",
    name: "Jan Dvořák",
    position: "GK",
    ovr: 89,
    rarity: "epic",
    pac: 68,
    sho: 22,
    pas: 73,
    dri: 64,
    def: 89,
    phy: 88,
    team: "Slavia Praha",
    nation: "Czech Republic",
  },
  {
    id: "e08",
    name: "Ángel Herrera",
    position: "CDM",
    ovr: 84,
    rarity: "epic",
    pac: 79,
    sho: 62,
    pas: 78,
    dri: 76,
    def: 85,
    phy: 87,
    team: "Atletico Madrid",
    nation: "Argentina",
  },
  {
    id: "e09",
    name: "Seun Adeleke",
    position: "ST",
    ovr: 90,
    rarity: "epic",
    pac: 92,
    sho: 89,
    pas: 75,
    dri: 87,
    def: 36,
    phy: 83,
    team: "Chelsea",
    nation: "Nigeria",
  },

  // Legendary (OVR 91-99)
  {
    id: "l01",
    name: "Carlos El Fenómeno",
    position: "ST",
    ovr: 95,
    rarity: "legendary",
    pac: 95,
    sho: 96,
    pas: 81,
    dri: 94,
    def: 38,
    phy: 88,
    team: "FC Legends",
    nation: "Brazil",
  },
  {
    id: "l02",
    name: "Viktor der Titan",
    position: "CB",
    ovr: 93,
    rarity: "legendary",
    pac: 80,
    sho: 55,
    pas: 82,
    dri: 76,
    def: 95,
    phy: 95,
    team: "FC Legends",
    nation: "Germany",
  },
  {
    id: "l03",
    name: "Théo le Maestro",
    position: "CAM",
    ovr: 97,
    rarity: "legendary",
    pac: 87,
    sho: 90,
    pas: 97,
    dri: 96,
    def: 58,
    phy: 78,
    team: "FC Legends",
    nation: "France",
  },
  {
    id: "l04",
    name: "Diogo O Mágico",
    position: "LW",
    ovr: 96,
    rarity: "legendary",
    pac: 97,
    sho: 91,
    pas: 88,
    dri: 97,
    def: 48,
    phy: 75,
    team: "FC Legends",
    nation: "Portugal",
  },
  {
    id: "l05",
    name: "Abdullah Al-Qasim",
    position: "GK",
    ovr: 91,
    rarity: "legendary",
    pac: 74,
    sho: 28,
    pas: 80,
    dri: 72,
    def: 93,
    phy: 91,
    team: "FC Legends",
    nation: "Saudi Arabia",
  },

  // Legendary OVR 90
  {
    id: "l06",
    name: "Marco El Fortín",
    position: "CB",
    ovr: 90,
    rarity: "legendary",
    pac: 78,
    sho: 52,
    pas: 79,
    dri: 74,
    def: 92,
    phy: 93,
    team: "FC Legends",
    nation: "Spain",
  },
  {
    id: "l07",
    name: "Yuto Hayabusa",
    position: "CM",
    ovr: 90,
    rarity: "legendary",
    pac: 82,
    sho: 76,
    pas: 91,
    dri: 88,
    def: 78,
    phy: 80,
    team: "FC Legends",
    nation: "Japan",
  },
  // Legendary OVR 92
  {
    id: "l08",
    name: "Emeka The Wall",
    position: "CB",
    ovr: 92,
    rarity: "legendary",
    pac: 81,
    sho: 57,
    pas: 83,
    dri: 77,
    def: 94,
    phy: 96,
    team: "FC Legends",
    nation: "Nigeria",
  },
  {
    id: "l09",
    name: "Rafael Vendaval",
    position: "RB",
    ovr: 92,
    rarity: "legendary",
    pac: 95,
    sho: 70,
    pas: 86,
    dri: 89,
    def: 90,
    phy: 82,
    team: "FC Legends",
    nation: "Brazil",
  },
  // Legendary OVR 94
  {
    id: "l10",
    name: "Ivan Stoïkov",
    position: "CDM",
    ovr: 94,
    rarity: "legendary",
    pac: 82,
    sho: 68,
    pas: 87,
    dri: 84,
    def: 96,
    phy: 97,
    team: "FC Legends",
    nation: "Bulgaria",
  },
  // Legendary OVR 98
  {
    id: "l11",
    name: "Elan Devereux",
    position: "CAM",
    ovr: 98,
    rarity: "legendary",
    pac: 90,
    sho: 93,
    pas: 98,
    dri: 97,
    def: 60,
    phy: 82,
    team: "FC Legends",
    nation: "France",
  },
  // Legendary OVR 100
  {
    id: "l12",
    name: "Alejandro Infinito",
    position: "ST",
    ovr: 100,
    rarity: "legendary",
    pac: 98,
    sho: 99,
    pas: 88,
    dri: 97,
    def: 42,
    phy: 90,
    team: "FC Legends",
    nation: "Argentina",
  },
];

// ─── Pack Definitions ─────────────────────────────────────────────────────────

const PACKS: PackDef[] = [
  {
    id: "basic",
    name: "Basic Pack",
    cost: 3000,
    cards: 3,
    dropRates: { common: 78, rare: 18, epic: 2, legendary: 2 },
    emoji: "📦",
    accent: "#9ca3af",
  },
  {
    id: "standard",
    name: "Standard Pack",
    cost: 7000,
    cards: 5,
    dropRates: { common: 54, rare: 28, epic: 12, legendary: 6 },
    emoji: "🎁",
    accent: "#60a5fa",
  },
  {
    id: "premium",
    name: "Premium Pack",
    cost: 9000,
    cards: 5,
    dropRates: { common: 33, rare: 35, epic: 20, legendary: 12 },
    emoji: "💎",
    accent: "#a855f7",
  },
  {
    id: "elite",
    name: "Elite Pack",
    cost: 22000,
    cards: 8,
    dropRates: { common: 8, rare: 35, epic: 35, legendary: 22 },
    emoji: "👑",
    accent: "#f97316",
  },
  {
    id: "ultimate",
    name: "Ultimate Pack",
    cost: 30000,
    cards: 10,
    dropRates: { common: 0, rare: 20, epic: 40, legendary: 40 },
    emoji: "🌟",
    accent: "#fbbf24",
  },
];

// ─── Card Generation ──────────────────────────────────────────────────────────

function weightedRarityPick(rates: PackDef["dropRates"]): Rarity {
  const roll = Math.random() * 100;
  if (roll < rates.legendary) return "legendary";
  if (roll < rates.legendary + rates.epic) return "epic";
  if (roll < rates.legendary + rates.epic + rates.rare) return "rare";
  return "common";
}

const LEGENDARY_OVR_TIERS = [
  { ovr: 90, weight: 40 },
  { ovr: 92, weight: 28 },
  { ovr: 94, weight: 14 },
  { ovr: 95, weight: 6 },
  { ovr: 96, weight: 3.5 },
  { ovr: 97, weight: 2.5 },
  { ovr: 98, weight: 2 },
  { ovr: 100, weight: 1.5 },
];

function pickLegendaryCard(): PlayerCard {
  const total = LEGENDARY_OVR_TIERS.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * total;
  let targetOvr = 90;
  for (const tier of LEGENDARY_OVR_TIERS) {
    roll -= tier.weight;
    if (roll <= 0) {
      targetOvr = tier.ovr;
      break;
    }
  }
  const legendaries = ALL_CARDS.filter((c) => c.rarity === "legendary");
  const exact = legendaries.filter((c) => c.ovr === targetOvr);
  if (exact.length > 0) return exact[Math.floor(Math.random() * exact.length)];
  legendaries.sort(
    (a, b) => Math.abs(a.ovr - targetOvr) - Math.abs(b.ovr - targetOvr),
  );
  return legendaries[0];
}

const PACK_COIN_REWARDS: Record<string, [number, number]> = {
  basic: [50, 150],
  standard: [120, 280],
  premium: [200, 450],
  elite: [400, 800],
  ultimate: [700, 1500],
};

function rollPackCoins(packId: string): number {
  const [min, max] = PACK_COIN_REWARDS[packId] ?? [50, 100];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePackCards(pack: PackDef): {
  cards: PlayerCard[];
  coins: number;
} {
  const result: PlayerCard[] = [];
  for (let i = 0; i < pack.cards; i++) {
    const rarity = weightedRarityPick(pack.dropRates);
    let card: PlayerCard;
    if (rarity === "legendary") {
      card = pickLegendaryCard();
    } else {
      const pool = ALL_CARDS.filter((c) => c.rarity === rarity);
      card = pool[Math.floor(Math.random() * pool.length)];
    }
    result.push(card);
  }
  return { cards: result, coins: rollPackCoins(pack.id) };
}

// ─── Rarity Styles ───────────────────────────────────────────────────────────

const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9ca3af",
  rare: "#60a5fa",
  epic: "#a855f7",
  legendary: "#fbbf24",
};

const RARITY_GLOW: Record<Rarity, string> = {
  common: "rgba(156,163,175,0.3)",
  rare: "rgba(96,165,250,0.4)",
  epic: "rgba(168,85,247,0.5)",
  legendary: "rgba(251,191,36,0.6)",
};

// ─── Card Component ───────────────────────────────────────────────────────────

function getOvrLabel(ovr: number): string {
  if (ovr >= 90) return "Good";
  if (ovr >= 80) return "Decent";
  if (ovr >= 70) return "Bad";
  return "Worthless";
}

function CardFace({ card }: { card: PlayerCard }) {
  const color = RARITY_COLORS[card.rarity];
  const glow = RARITY_GLOW[card.rarity];

  return (
    <div
      style={{
        width: 120,
        height: 170,
        borderRadius: 12,
        border: `2px solid ${color}`,
        boxShadow: `0 0 18px ${glow}, 0 4px 16px rgba(0,0,0,0.6)`,
        background: "rgba(15,15,25,0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 8px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
        userSelect: "none",
      }}
    >
      {/* Rarity shimmer background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at top, ${color}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Top row: nation + position */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.5)",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {card.nation.slice(0, 3).toUpperCase()}
        </span>
        <span
          style={{
            background: color,
            color: "#000",
            fontSize: 9,
            fontWeight: 800,
            padding: "2px 6px",
            borderRadius: 6,
            letterSpacing: "0.06em",
          }}
        >
          {card.position}
        </span>
      </div>

      {/* OVR */}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div
          style={{
            color,
            fontSize: 32,
            fontWeight: 900,
            lineHeight: 1,
            textShadow: "none",
          }}
        >
          {card.ovr}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 9,
            letterSpacing: "0.08em",
            marginTop: 2,
          }}
        >
          OVR
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.06em",
            marginTop: 1,
          }}
        >
          {getOvrLabel(card.ovr)}
        </div>
      </div>

      {/* Name */}
      <div
        style={{
          color: "white",
          fontSize: 10,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.3,
          zIndex: 1,
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        {card.name}
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "3px 8px",
          width: "100%",
          zIndex: 1,
        }}
      >
        {(
          [
            ["PAC", card.pac],
            ["SHO", card.sho],
            ["PAS", card.pas],
            ["DRI", card.dri],
            ["DEF", card.def],
            ["PHY", card.phy],
          ] as [string, number][]
        ).map(([label, val]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ color, fontSize: 11, fontWeight: 800 }}>{val}</div>
            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 8,
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Team */}
      <div
        style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 8,
          textAlign: "center",
          zIndex: 1,
          fontStyle: "italic",
        }}
      >
        {card.team}
      </div>
    </div>
  );
}

function CardBack() {
  return (
    <div
      style={{
        width: 120,
        height: 170,
        borderRadius: 12,
        border: "2px solid rgba(255,255,255,0.15)",
        background:
          "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
        boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
      }}
    >
      ⚽
    </div>
  );
}

// ─── Walkout Animation ────────────────────────────────────────────────────────

function WalkoutScreen({
  card,
  onDone,
}: { card: PlayerCard; onDone: () => void }) {
  const [phase, setPhase] = useState<"flash" | "slide" | "details" | "done">(
    "flash",
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("slide"), 400);
    const t2 = setTimeout(() => setPhase("details"), 1200);
    const t3 = setTimeout(() => {
      setPhase("done");
      onDone();
    }, 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const rarityColors: Record<string, string[]> = {
    legendary: ["#fbbf24", "#f59e0b", "#d97706"],
    epic: ["#a855f7", "#9333ea", "#7c3aed"],
    rare: ["#3b82f6", "#2563eb", "#1d4ed8"],
    common: ["#6b7280", "#4b5563", "#374151"],
  };
  const cols = rarityColors[card.rarity] || rarityColors.common;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background:
          phase === "flash"
            ? `radial-gradient(circle at center, ${cols[0]}, ${cols[1]}, #000)`
            : `linear-gradient(160deg, #0a0a0a 0%, #111 60%, ${cols[2]}44 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.8s ease",
        overflow: "hidden",
      }}
    >
      {/* Light rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <div
          key={`ray-${deg}`}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 3,
            height: "120vmax",
            background: `linear-gradient(to bottom, ${cols[0]}88, transparent)`,
            transform: `translate(-50%, -50%) rotate(${deg}deg)`,
            transformOrigin: "center top",
            opacity: phase === "flash" ? 0.6 : 0.15,
            transition: "opacity 0.8s ease",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Rarity label */}
      <div
        style={{
          color: cols[0],
          fontSize: "clamp(11px, 2.5vw, 14px)",
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          marginBottom: 16,
          opacity: phase === "details" ? 1 : 0,
          transform:
            phase === "details" ? "translateY(0)" : "translateY(-20px)",
          transition: "all 0.5s ease",
          textShadow: `0 0 20px ${cols[0]}`,
        }}
      >
        ✦ {card.rarity.toUpperCase()} ✦
      </div>

      {/* Card with glow */}
      <div
        style={{
          filter: `drop-shadow(0 0 40px ${cols[0]}cc)`,
          transform:
            phase === "slide"
              ? "scale(0.1) translateY(60px)"
              : phase === "details"
                ? "scale(1.1) translateY(0)"
                : "scale(1.1) translateY(0)",
          opacity: phase === "flash" ? 0 : 1,
          transition:
            "transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease",
        }}
      >
        <CardFace card={card} />
      </div>

      {/* Player info slide-in */}
      <div
        style={{
          marginTop: 28,
          textAlign: "center",
          opacity: phase === "details" ? 1 : 0,
          transform: phase === "details" ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.6s ease 0.2s",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "clamp(22px, 5vw, 38px)",
            fontWeight: 900,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.02em",
            textShadow: `0 2px 20px ${cols[0]}88`,
          }}
        >
          {card.name}
        </div>
        <div
          style={{
            color: cols[0],
            fontSize: "clamp(13px, 2.5vw, 18px)",
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <span>{card.nation}</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
          <span>{card.position}</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
          <span>{card.team}</span>
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "clamp(11px, 2vw, 15px)",
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            marginTop: 8,
            letterSpacing: "0.05em",
          }}
        >
          OVR {card.ovr}
        </div>
      </div>

      {/* Tap to continue */}
      <button
        type="button"
        onClick={() => {
          setPhase("done");
          onDone();
        }}
        style={{
          position: "absolute",
          bottom: 48,
          background: "rgba(255,255,255,0.08)",
          border: `1px solid ${cols[0]}55`,
          borderRadius: 30,
          color: "rgba(255,255,255,0.6)",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          padding: "10px 28px",
          cursor: "pointer",
          opacity: phase === "details" ? 1 : 0,
          transition: "opacity 0.5s ease 0.5s",
        }}
      >
        Tap to continue
      </button>
    </div>
  );
}

// ─── Opening Animation ────────────────────────────────────────────────────────

function PackOpeningScreen({
  cards,
  onCollect,
  coins,
}: { cards: PlayerCard[]; onCollect: () => void; coins: number }) {
  const [revealed, setRevealed] = useState(0);
  const [walkoutCard, setWalkoutCard] = useState<PlayerCard | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRevealed((prev) => {
        if (prev >= cards.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }
        const nextCard = cards[prev];
        if (nextCard && nextCard.rarity === "legendary") {
          if (timerRef.current) clearInterval(timerRef.current);
          setWalkoutCard(nextCard);
        }
        return prev + 1;
      });
    }, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cards]);

  const revealAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRevealed(cards.length);
  };

  if (walkoutCard) {
    return (
      <WalkoutScreen card={walkoutCard} onDone={() => setWalkoutCard(null)} />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.96)",
        backdropFilter: "blur(20px)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: 24,
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: "clamp(20px, 4vw, 32px)",
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        Pack Opening 🎴
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
          maxWidth: 700,
        }}
      >
        {cards.map((card, i) => (
          <button
            key={card.id}
            type="button"
            style={{
              perspective: 600,
              cursor: revealed <= i ? "pointer" : "default",
              background: "none",
              border: "none",
              padding: 0,
            }}
            onClick={() => {
              if (revealed <= i) {
                const nextCard = cards[i];
                if (
                  (nextCard.rarity === "legendary" ||
                    nextCard.rarity === "epic") &&
                  revealed === i
                ) {
                  setWalkoutCard(nextCard);
                }
                setRevealed(i + 1);
              }
            }}
          >
            <div
              style={{
                transition: "transform 0.55s ease",
                transformStyle: "preserve-3d",
                transform: revealed > i ? "rotateY(180deg)" : "rotateY(0deg)",
                position: "relative",
                width: 120,
                height: 170,
              }}
            >
              <div
                style={{ position: "absolute", backfaceVisibility: "hidden" }}
              >
                <CardBack />
              </div>
              <div
                style={{
                  position: "absolute",
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <CardFace card={card} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {revealed < cards.length && (
          <button
            type="button"
            data-ocid="packs.reveal_all.button"
            onClick={revealAll}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 30,
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              padding: "12px 28px",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Reveal All
          </button>
        )}
        {revealed >= cards.length && (
          <>
            <div
              style={{
                background: "linear-gradient(135deg, #d97706, #15803d)",
                borderRadius: 30,
                color: "white",
                fontSize: 15,
                fontWeight: 800,
                fontFamily: "system-ui, sans-serif",
                padding: "10px 28px",
                boxShadow: "0 0 18px rgba(217,119,6,0.5)",
                letterSpacing: "0.02em",
              }}
            >
              +{coins} 🪙 Coins added to your wallet!
            </div>
            <button
              type="button"
              data-ocid="packs.collect.button"
              onClick={onCollect}
              style={{
                background: "linear-gradient(135deg, #a855f7, #6366f1)",
                border: "none",
                borderRadius: 30,
                color: "white",
                fontSize: 16,
                fontWeight: 800,
                fontFamily: "system-ui, sans-serif",
                padding: "14px 40px",
                cursor: "pointer",
                minHeight: 44,
                boxShadow: "0 4px 24px rgba(168,85,247,0.4)",
              }}
            >
              Add to Collection ✅
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Collection Screen ────────────────────────────────────────────────────────

function CollectionScreen({ onClose }: { onClose: () => void }) {
  const collection = getCollection();
  const cards = collection
    .map((owned) => ({
      owned,
      card: ALL_CARDS.find((c) => c.id === owned.cardId)!,
    }))
    .filter((x) => x.card)
    .sort((a, b) => b.card.ovr - a.card.ovr);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.96)",
        backdropFilter: "blur(20px)",
        zIndex: 150,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "max(20px, env(safe-area-inset-top, 20px))",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          data-ocid="collection.back.button"
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 12,
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            padding: "10px 18px",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          ← Back
        </button>
        <h2
          style={{
            color: "white",
            fontSize: "clamp(16px, 3vw, 24px)",
            fontWeight: 900,
            fontFamily: "system-ui, sans-serif",
            margin: 0,
          }}
        >
          My Collection ({cards.length} cards)
        </h2>
        <div style={{ width: 80 }} />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          width: "100%",
          maxWidth: 700,
          padding: "0 20px 40px",
        }}
      >
        {cards.length === 0 ? (
          <div
            data-ocid="collection.empty_state"
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 16,
              textAlign: "center",
              marginTop: 80,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            No cards yet — open some packs! 🎴
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              justifyContent: "center",
            }}
          >
            {cards.map(({ card, owned }, idx) => (
              <div
                key={card.id}
                data-ocid={`collection.item.${idx + 1}`}
                style={{ position: "relative" }}
              >
                <CardFace card={card} />
                {owned.duplicates > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      background: "#ef4444",
                      color: "white",
                      borderRadius: "50%",
                      width: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: "system-ui, sans-serif",
                      border: "2px solid #1a1a2e",
                    }}
                  >
                    x{owned.duplicates}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pack Store ───────────────────────────────────────────────────────────────

function PackStore({
  gems,
  onGemsChange,
  onClose,
}: { gems: number; onGemsChange: (n: number) => void; onClose: () => void }) {
  const [openingCards, setOpeningCards] = useState<PlayerCard[] | null>(null);
  const [openingCoins, setOpeningCoins] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [packOpensToday, setPackOpensToday] = useState(getPackOpensToday);
  const DAILY_PACK_LIMIT = 3;

  const handleOpen = (pack: PackDef) => {
    setErrorMsg(null);
    if (packOpensToday >= DAILY_PACK_LIMIT) {
      setErrorMsg("Daily pack limit reached (3/day). Resets at midnight.");
      return;
    }
    if (!deductGems(pack.cost)) {
      setErrorMsg(`Not enough 💎 for ${pack.name}`);
      return;
    }
    onGemsChange(getGems());
    const { cards, coins: packCoins } = generatePackCards(pack);
    setOpeningCoins(packCoins);
    setOpeningCards(cards);
  };

  const handleCollect = (cards: PlayerCard[]) => {
    addCardsToCollection(cards.map((c) => c.id));
    incrementPackOpens();
    setPackOpensToday(getPackOpensToday());
    // Track open pack challenge (daily)
    const cs = getChallenges();
    const ch = cs.challenges.find((c) => c.id === "openpack");
    if (ch && !ch.done && ch.progress >= 0) {
      ch.progress = Math.min(ch.target, ch.progress + 1);
      if (ch.progress >= ch.target) ch.done = true;
      saveChallenges(cs);
    }
    // Track weekly challenge
    const ws = getWeeklyChallenges();
    const wCh = ws.challenges.find((c) => c.id === "open3packs");
    if (wCh && !wCh.done) {
      wCh.progress = Math.min(wCh.target, wCh.progress + 1);
      if (wCh.progress >= wCh.target) wCh.done = true;
      saveWeeklyChallenges(ws);
    }
    addCoins(openingCoins);
    setOpeningCards(null);
  };

  if (openingCards) {
    return (
      <PackOpeningScreen
        cards={openingCards}
        coins={openingCoins}
        onCollect={() => handleCollect(openingCards)}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.96)",
        backdropFilter: "blur(20px)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "max(20px, env(safe-area-inset-top, 20px))",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <button
          type="button"
          data-ocid="packs.close.button"
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 12,
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            padding: "10px 18px",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          ← Back
        </button>
        <h2
          style={{
            color: "white",
            fontSize: "clamp(18px, 4vw, 28px)",
            fontWeight: 900,
            fontFamily: "system-ui, sans-serif",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          🎴 Pack Store
        </h2>
        <div
          style={{
            background: "rgba(251,191,36,0.15)",
            border: "1px solid rgba(251,191,36,0.4)",
            borderRadius: 20,
            padding: "8px 18px",
            color: "#fbbf24",
            fontSize: 16,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          💎 {gems.toLocaleString()}
        </div>
      </div>

      {errorMsg && (
        <div
          data-ocid="packs.error_state"
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 10,
            color: "#f87171",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            padding: "10px 20px",
            marginBottom: 8,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Daily limit indicator */}
      <div
        data-ocid="packs.daily_limit.panel"
        style={{
          background:
            packOpensToday >= DAILY_PACK_LIMIT
              ? "rgba(239,68,68,0.12)"
              : "rgba(255,255,255,0.05)",
          border: `1px solid ${packOpensToday >= DAILY_PACK_LIMIT ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 10,
          padding: "8px 16px",
          color:
            packOpensToday >= DAILY_PACK_LIMIT
              ? "#f87171"
              : "rgba(255,255,255,0.6)",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          marginBottom: 4,
          textAlign: "center" as const,
        }}
      >
        {packOpensToday}/{DAILY_PACK_LIMIT} packs opened today
        {packOpensToday >= DAILY_PACK_LIMIT && " — resets at midnight"}
      </div>

      {/* Pack grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          justifyContent: "center",
          padding: "16px 20px 40px",
          maxWidth: 760,
        }}
      >
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            data-ocid={`packs.${pack.id}.card`}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `2px solid ${pack.accent}55`,
              borderRadius: 20,
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              minWidth: 200,
              maxWidth: 220,
              boxShadow: `0 0 24px ${pack.accent}22`,
              flex: "1 1 200px",
            }}
          >
            <div style={{ fontSize: 44 }}>{pack.emoji}</div>
            <div
              style={{
                color: pack.accent,
                fontWeight: 900,
                fontSize: 16,
                fontFamily: "system-ui, sans-serif",
                textAlign: "center",
                letterSpacing: "0.02em",
              }}
            >
              {pack.name}
            </div>

            {/* Drop rates */}
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {(
                [
                  ["Common", pack.dropRates.common, "#9ca3af"],
                  ["Rare", pack.dropRates.rare, "#60a5fa"],
                  ["Epic", pack.dropRates.epic, "#a855f7"],
                  ["Legendary", pack.dropRates.legendary, "#fbbf24"],
                ] as [string, number, string][]
              ).map(([label, rate, color]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 11,
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      color,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {rate}%
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 12,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {pack.cards} cards per pack
            </div>

            <button
              type="button"
              data-ocid={`packs.${pack.id}.open_modal_button`}
              onClick={() => handleOpen(pack)}
              style={{
                background:
                  gems >= pack.cost
                    ? `linear-gradient(135deg, ${pack.accent}, ${pack.accent}bb)`
                    : "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: 30,
                color: gems >= pack.cost ? "#000" : "rgba(255,255,255,0.35)",
                fontWeight: 800,
                fontSize: 14,
                fontFamily: "system-ui, sans-serif",
                padding: "12px 24px",
                cursor: gems >= pack.cost ? "pointer" : "not-allowed",
                minHeight: 44,
                width: "100%",
                letterSpacing: "0.04em",
                boxShadow:
                  gems >= pack.cost ? `0 4px 16px ${pack.accent}44` : "none",
              }}
            >
              💎 {pack.cost.toLocaleString()}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface PackSystemProps {
  onClose: () => void;
}

export default function PackSystem({ onClose }: PackSystemProps) {
  const [gems, setGems] = useState(getGems);
  const [view, setView] = useState<"store" | "collection">("store");

  if (view === "collection") {
    return <CollectionScreen onClose={() => setView("store")} />;
  }

  return (
    <div>
      <PackStore gems={gems} onGemsChange={setGems} onClose={onClose} />

      {/* View collection button (fixed bottom bar) */}
      <div
        style={{
          position: "fixed",
          bottom: "max(20px, env(safe-area-inset-bottom, 20px))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 110,
        }}
      >
        <button
          type="button"
          data-ocid="packs.collection.button"
          onClick={() => setView("collection")}
          style={{
            background: "rgba(0,0,0,0.8)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 30,
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            padding: "12px 28px",
            cursor: "pointer",
            minHeight: 44,
            backdropFilter: "blur(8px)",
          }}
        >
          📋 My Collection
        </button>
      </div>
    </div>
  );
}

// Re-exports from storage for backward compat
export {
  addGems,
  getGems as getGemsFromStorage,
  getCollection,
} from "./storage";

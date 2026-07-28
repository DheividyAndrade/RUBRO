export interface ImbuementItem {
  name: string;
  quantity: number;
  image?: string;
}

export interface Imbuement {
  id: string;
  name: string;
  slot: string;
  tier: string;
  effect: string;
  items: ImbuementItem[];
  cost: number;
  time: string;
}

export const IMBUEMENTS: Imbuement[] = [
  // ====== MANA LEECH ======
  {
    id: "basic-void",
    name: "Void (Basic)",
    slot: "Helmet",
    tier: "Basic",
    effect: "Converte 3% do dano causado em Mana (limitado a 25 Mana por turno)",
    items: [{ name: "Rope Belt", quantity: 25 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-void",
    name: "Void (Intricate)",
    slot: "Helmet",
    tier: "Intricate",
    effect: "Converte 5% do dano causado em Mana (limitado a 50 Mana por turno)",
    items: [
      { name: "Rope Belt", quantity: 25 },
      { name: "Silencer Claws", quantity: 25 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-void",
    name: "Void (Powerful)",
    slot: "Helmet",
    tier: "Powerful",
    effect: "Converte 8% do dano causado em Mana (limitado a 100 Mana por turno)",
    items: [
      { name: "Rope Belt", quantity: 25 },
      { name: "Silencer Claws", quantity: 20 },
      { name: "Some Grimeleech Wings", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== LIFE LEECH ======
  {
    id: "basic-vampirism",
    name: "Vampirism (Basic)",
    slot: "Helmet",
    tier: "Basic",
    effect: "Converte 5% do dano causado em HP (limitado a 25 HP por turno)",
    items: [{ name: "Vampire Teeth", quantity: 25 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-vampirism",
    name: "Vampirism (Intricate)",
    slot: "Helmet",
    tier: "Intricate",
    effect: "Converte 10% do dano causado em HP (limitado a 50 HP por turno)",
    items: [
      { name: "Vampire Teeth", quantity: 25 },
      { name: "Bloody Pincers", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-vampirism",
    name: "Vampirism (Powerful)",
    slot: "Helmet",
    tier: "Powerful",
    effect: "Converte 25% do dano causado em HP (limitado a 100 HP por turno)",
    items: [
      { name: "Vampire Teeth", quantity: 25 },
      { name: "Bloody Pincers", quantity: 20 },
      { name: "Piece of Dead Brain", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== CRITICAL ======
  {
    id: "basic-strike",
    name: "Strike (Basic)",
    slot: "Helmet",
    tier: "Basic",
    effect: "Aumenta o Critical Hit em 10% (dano extra de 20%)",
    items: [{ name: "Protective Charm", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-strike",
    name: "Strike (Intricate)",
    slot: "Helmet",
    tier: "Intricate",
    effect: "Aumenta o Critical Hit em 10% (dano extra de 35%)",
    items: [
      { name: "Protective Charm", quantity: 25 },
      { name: "Sabreteeth", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-strike",
    name: "Strike (Powerful)",
    slot: "Helmet",
    tier: "Powerful",
    effect: "Aumenta o Critical Hit em 10% (dano extra de 50%)",
    items: [
      { name: "Protective Charm", quantity: 25 },
      { name: "Sabreteeth", quantity: 20 },
      { name: "Vexclaw Talon", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== DISTANCE SKILL ======
  {
    id: "basic-epiphany",
    name: "Epiphany (Basic)",
    slot: "Helmet",
    tier: "Basic",
    effect: "+1 Distance Fighting",
    items: [{ name: "Elvish Talisman", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-epiphany",
    name: "Epiphany (Intricate)",
    slot: "Helmet",
    tier: "Intricate",
    effect: "+3 Distance Fighting",
    items: [
      { name: "Elvish Talisman", quantity: 25 },
      { name: "Broken Shamanic Staff", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-epiphany",
    name: "Epiphany (Powerful)",
    slot: "Helmet",
    tier: "Powerful",
    effect: "+4 Distance Fighting",
    items: [
      { name: "Elvish Talisman", quantity: 25 },
      { name: "Broken Shamanic Staff", quantity: 20 },
      { name: "Jade Hat", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== MAGIC LEVEL ======
  {
    id: "basic-enchant",
    name: "Magic Level (Basic)",
    slot: "Helmet",
    tier: "Basic",
    effect: "+1 Magic Level",
    items: [{ name: "Elvish Talisman", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-enchant",
    name: "Magic Level (Intricate)",
    slot: "Helmet",
    tier: "Intricate",
    effect: "+3 Magic Level",
    items: [
      { name: "Elvish Talisman", quantity: 25 },
      { name: "Broken Shamanic Staff", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-enchant",
    name: "Magic Level (Powerful)",
    slot: "Helmet",
    tier: "Powerful",
    effect: "+4 Magic Level",
    items: [
      { name: "Elvish Talisman", quantity: 25 },
      { name: "Broken Shamanic Staff", quantity: 20 },
      { name: "Jade Hat", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== ARMOR DODGE ======
  {
    id: "basic-dodge",
    name: "Dodge (Basic)",
    slot: "Armor",
    tier: "Basic",
    effect: "10% de chance de esquivar de ataques físicos",
    items: [{ name: "Cultish Mask", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-dodge",
    name: "Dodge (Intricate)",
    slot: "Armor",
    tier: "Intricate",
    effect: "15% de chance de esquivar de ataques físicos",
    items: [
      { name: "Cultish Mask", quantity: 25 },
      { name: "Cultish Robe", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-dodge",
    name: "Dodge (Powerful)",
    slot: "Armor",
    tier: "Powerful",
    effect: "20% de chance de esquivar de ataques físicos",
    items: [
      { name: "Cultish Mask", quantity: 25 },
      { name: "Cultish Robe", quantity: 20 },
      { name: "Swan Feather Cloak", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== CAPACITY ======
  {
    id: "basic-capacity",
    name: "Capacity (Basic)",
    slot: "Helmet",
    tier: "Basic",
    effect: "+100 Capacity",
    items: [{ name: "Elvish Talisman", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-capacity",
    name: "Capacity (Intricate)",
    slot: "Helmet",
    tier: "Intricate",
    effect: "+300 Capacity",
    items: [
      { name: "Elvish Talisman", quantity: 25 },
      { name: "Orc Tooth", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-capacity",
    name: "Capacity (Powerful)",
    slot: "Helmet",
    tier: "Powerful",
    effect: "+500 Capacity",
    items: [
      { name: "Elvish Talisman", quantity: 25 },
      { name: "Orc Tooth", quantity: 20 },
      { name: "Mystical Hourglass", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== DEATH PROTECTION ======
  {
    id: "basic-death",
    name: "Death Protection (Basic)",
    slot: "Armor",
    tier: "Basic",
    effect: "Reduz dano de Death em 3%",
    items: [{ name: "Flask of Embalming Fluid", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-death",
    name: "Death Protection (Intricate)",
    slot: "Armor",
    tier: "Intricate",
    effect: "Reduz dano de Death em 8%",
    items: [
      { name: "Flask of Embalming Fluid", quantity: 25 },
      { name: "Gloom Wolf Fur", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-death",
    name: "Death Protection (Powerful)",
    slot: "Armor",
    tier: "Powerful",
    effect: "Reduz dano de Death em 15%",
    items: [
      { name: "Flask of Embalming Fluid", quantity: 25 },
      { name: "Gloom Wolf Fur", quantity: 20 },
      { name: "Mystical Hourglass", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== FIRE PROTECTION ======
  {
    id: "basic-fire",
    name: "Fire Protection (Basic)",
    slot: "Armor",
    tier: "Basic",
    effect: "Reduz dano de Fire em 3%",
    items: [{ name: "Green Dragon Scale", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-fire",
    name: "Fire Protection (Intricate)",
    slot: "Armor",
    tier: "Intricate",
    effect: "Reduz dano de Fire em 8%",
    items: [
      { name: "Green Dragon Scale", quantity: 25 },
      { name: "Draken Sulphur", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-fire",
    name: "Fire Protection (Powerful)",
    slot: "Armor",
    tier: "Powerful",
    effect: "Reduz dano de Fire em 15%",
    items: [
      { name: "Green Dragon Scale", quantity: 25 },
      { name: "Draken Sulphur", quantity: 20 },
      { name: "White Pale", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== ENERGY PROTECTION ======
  {
    id: "basic-energy",
    name: "Energy Protection (Basic)",
    slot: "Armor",
    tier: "Basic",
    effect: "Reduz dano de Energy em 3%",
    items: [{ name: "Wyvern Talisman", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-energy",
    name: "Energy Protection (Intricate)",
    slot: "Armor",
    tier: "Intricate",
    effect: "Reduz dano de Energy em 8%",
    items: [
      { name: "Wyvern Talisman", quantity: 25 },
      { name: "Crawler Head Plating", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-energy",
    name: "Energy Protection (Powerful)",
    slot: "Armor",
    tier: "Powerful",
    effect: "Reduz dano de Energy em 15%",
    items: [
      { name: "Wyvern Talisman", quantity: 25 },
      { name: "Crawler Head Plating", quantity: 20 },
      { name: "White Pale", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== ICE PROTECTION ======
  {
    id: "basic-ice",
    name: "Ice Protection (Basic)",
    slot: "Armor",
    tier: "Basic",
    effect: "Reduz dano de Ice em 3%",
    items: [{ name: "Winter Wolf Fur", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-ice",
    name: "Ice Protection (Intricate)",
    slot: "Armor",
    tier: "Intricate",
    effect: "Reduz dano de Ice em 8%",
    items: [
      { name: "Winter Wolf Fur", quantity: 25 },
      { name: "Thick Fur", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-ice",
    name: "Ice Protection (Powerful)",
    slot: "Armor",
    tier: "Powerful",
    effect: "Reduz dano de Ice em 15%",
    items: [
      { name: "Winter Wolf Fur", quantity: 25 },
      { name: "Thick Fur", quantity: 20 },
      { name: "Deeptags", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== EARTH PROTECTION ======
  {
    id: "basic-earth",
    name: "Earth Protection (Basic)",
    slot: "Armor",
    tier: "Basic",
    effect: "Reduz dano de Earth em 3%",
    items: [{ name: "Piece of Swampling Wood", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-earth",
    name: "Earth Protection (Intricate)",
    slot: "Armor",
    tier: "Intricate",
    effect: "Reduz dano de Earth em 8%",
    items: [
      { name: "Piece of Swampling Wood", quantity: 25 },
      { name: "Snake Skin", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-earth",
    name: "Earth Protection (Powerful)",
    slot: "Armor",
    tier: "Powerful",
    effect: "Reduz dano de Earth em 15%",
    items: [
      { name: "Piece of Swampling Wood", quantity: 25 },
      { name: "Snake Skin", quantity: 20 },
      { name: "Deeptags", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== HOLY PROTECTION ======
  {
    id: "basic-holy",
    name: "Holy Protection (Basic)",
    slot: "Armor",
    tier: "Basic",
    effect: "Reduz dano de Holy em 3%",
    items: [{ name: "Cultish Mask", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-holy",
    name: "Holy Protection (Intricate)",
    slot: "Armor",
    tier: "Intricate",
    effect: "Reduz dano de Holy em 8%",
    items: [
      { name: "Cultish Mask", quantity: 25 },
      { name: "Cultish Robe", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-holy",
    name: "Holy Protection (Powerful)",
    slot: "Armor",
    tier: "Powerful",
    effect: "Reduz dano de Holy em 15%",
    items: [
      { name: "Cultish Mask", quantity: 25 },
      { name: "Cultish Robe", quantity: 20 },
      { name: "Swan Feather Cloak", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== AXE FIGHTING ======
  {
    id: "basic-axe",
    name: "Axe Fighting (Basic)",
    slot: "Helmet",
    tier: "Basic",
    effect: "+1 Axe Fighting",
    items: [{ name: "Cyclops Toe", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-axe",
    name: "Axe Fighting (Intricate)",
    slot: "Helmet",
    tier: "Intricate",
    effect: "+3 Axe Fighting",
    items: [
      { name: "Cyclops Toe", quantity: 25 },
      { name: "Ogre Nose Ring", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-axe",
    name: "Axe Fighting (Powerful)",
    slot: "Helmet",
    tier: "Powerful",
    effect: "+4 Axe Fighting",
    items: [
      { name: "Cyclops Toe", quantity: 25 },
      { name: "Ogre Nose Ring", quantity: 20 },
      { name: "Warmaster's Wristguards", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== SWORD FIGHTING ======
  {
    id: "basic-sword",
    name: "Sword Fighting (Basic)",
    slot: "Helmet",
    tier: "Basic",
    effect: "+1 Sword Fighting",
    items: [{ name: "Cyclops Toe", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-sword",
    name: "Sword Fighting (Intricate)",
    slot: "Helmet",
    tier: "Intricate",
    effect: "+3 Sword Fighting",
    items: [
      { name: "Cyclops Toe", quantity: 25 },
      { name: "Orc Tooth", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-sword",
    name: "Sword Fighting (Powerful)",
    slot: "Helmet",
    tier: "Powerful",
    effect: "+4 Sword Fighting",
    items: [
      { name: "Cyclops Toe", quantity: 25 },
      { name: "Orc Tooth", quantity: 20 },
      { name: "Warmaster's Wristguards", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== CLUB FIGHTING ======
  {
    id: "basic-club",
    name: "Club Fighting (Basic)",
    slot: "Helmet",
    tier: "Basic",
    effect: "+1 Club Fighting",
    items: [{ name: "Cyclops Toe", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-club",
    name: "Club Fighting (Intricate)",
    slot: "Helmet",
    tier: "Intricate",
    effect: "+3 Club Fighting",
    items: [
      { name: "Cyclops Toe", quantity: 25 },
      { name: "Orc Tooth", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-club",
    name: "Club Fighting (Powerful)",
    slot: "Helmet",
    tier: "Powerful",
    effect: "+4 Club Fighting",
    items: [
      { name: "Cyclops Toe", quantity: 25 },
      { name: "Orc Tooth", quantity: 20 },
      { name: "Warmaster's Wristguards", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== SHIELDING ======
  {
    id: "basic-shielding",
    name: "Shielding (Basic)",
    slot: "Shield",
    tier: "Basic",
    effect: "+1 Shielding",
    items: [{ name: "Battle Stone", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-shielding",
    name: "Shielding (Intricate)",
    slot: "Shield",
    tier: "Intricate",
    effect: "+3 Shielding",
    items: [
      { name: "Battle Stone", quantity: 25 },
      { name: "Piece of Scarab Shell", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-shielding",
    name: "Shielding (Powerful)",
    slot: "Shield",
    tier: "Powerful",
    effect: "+4 Shielding",
    items: [
      { name: "Battle Stone", quantity: 25 },
      { name: "Piece of Scarab Shell", quantity: 20 },
      { name: "Mystical Hourglass", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },

  // ====== ELEMENTAL PROTECTION SHIELD ======
  {
    id: "basic-elemental-shield",
    name: "Elemental Protection (Basic)",
    slot: "Shield",
    tier: "Basic",
    effect: "Reduz dano elemental em 3% (Fire, Energy, Ice, Earth)",
    items: [{ name: "Blazing Bone", quantity: 20 }],
    cost: 5000,
    time: "20h",
  },
  {
    id: "intricate-elemental-shield",
    name: "Elemental Protection (Intricate)",
    slot: "Shield",
    tier: "Intricate",
    effect: "Reduz dano elemental em 8% (Fire, Energy, Ice, Earth)",
    items: [
      { name: "Blazing Bone", quantity: 25 },
      { name: "Draken Sulphur", quantity: 20 },
    ],
    cost: 30000,
    time: "20h",
  },
  {
    id: "powerful-elemental-shield",
    name: "Elemental Protection (Powerful)",
    slot: "Shield",
    tier: "Powerful",
    effect: "Reduz dano elemental em 15% (Fire, Energy, Ice, Earth)",
    items: [
      { name: "Blazing Bone", quantity: 25 },
      { name: "Draken Sulphur", quantity: 20 },
      { name: "Warmaster's Wristguards", quantity: 5 },
    ],
    cost: 150000,
    time: "20h",
  },
];

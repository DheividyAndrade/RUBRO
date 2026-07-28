export interface ImbuementItem {
  name: string;
  quantity: number;
}

export interface Imbuement {
  id: string;
  name: string;
  slot: string;
  tier: string;
  category: string;
  effect: string;
  items: ImbuementItem[];
  cost: number;
  time: string;
}

export const IMBUEMENTS: Imbuement[] = [
  // ====== MANA LEECH ======
  { id:"basic-void", name:"Void (Basic)", slot:"Helmet", tier:"Basic", category:"Mana Leech", effect:"3% do dano vira Mana", items:[{name:"Rope Belt",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-void", name:"Void (Intricate)", slot:"Helmet", tier:"Intricate", category:"Mana Leech", effect:"5% do dano vira Mana", items:[{name:"Rope Belt",quantity:25},{name:"Silencer Claws",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-void", name:"Void (Powerful)", slot:"Helmet", tier:"Powerful", category:"Mana Leech", effect:"8% do dano vira Mana", items:[{name:"Rope Belt",quantity:25},{name:"Silencer Claws",quantity:20},{name:"Some Grimeleech Wings",quantity:5}], cost:250000, time:"20h" },

  // ====== LIFE LEECH ======
  { id:"basic-vampirism", name:"Vampirism (Basic)", slot:"Helmet", tier:"Basic", category:"Life Leech", effect:"5% do dano vira HP", items:[{name:"Vampire Teeth",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-vampirism", name:"Vampirism (Intricate)", slot:"Helmet", tier:"Intricate", category:"Life Leech", effect:"10% do dano vira HP", items:[{name:"Vampire Teeth",quantity:25},{name:"Bloody Pincers",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-vampirism", name:"Vampirism (Powerful)", slot:"Helmet", tier:"Powerful", category:"Life Leech", effect:"25% do dano vira HP", items:[{name:"Vampire Teeth",quantity:25},{name:"Bloody Pincers",quantity:20},{name:"Piece of Dead Brain",quantity:5}], cost:250000, time:"20h" },

  // ====== CRITICAL ======
  { id:"basic-strike", name:"Strike (Basic)", slot:"Helmet", tier:"Basic", category:"Critical", effect:"+15% dano crítico (10% chance)", items:[{name:"Protective Charm",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-strike", name:"Strike (Intricate)", slot:"Helmet", tier:"Intricate", category:"Critical", effect:"+25% dano crítico (10% chance)", items:[{name:"Protective Charm",quantity:25},{name:"Sabreteeth",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-strike", name:"Strike (Powerful)", slot:"Helmet", tier:"Powerful", category:"Critical", effect:"+50% dano crítico (10% chance)", items:[{name:"Protective Charm",quantity:25},{name:"Sabreteeth",quantity:20},{name:"Vexclaw Talon",quantity:5}], cost:250000, time:"20h" },

  // ====== DISTANCE ======
  { id:"basic-precision", name:"Precision (Basic)", slot:"Helmet", tier:"Basic", category:"Distance", effect:"+1 Distance Fighting", items:[{name:"Elven Scouting Glass",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-precision", name:"Precision (Intricate)", slot:"Helmet", tier:"Intricate", category:"Distance", effect:"+2 Distance Fighting", items:[{name:"Elven Scouting Glass",quantity:25},{name:"Elven Hoof",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-precision", name:"Precision (Powerful)", slot:"Helmet", tier:"Powerful", category:"Distance", effect:"+4 Distance Fighting", items:[{name:"Elven Scouting Glass",quantity:25},{name:"Elven Hoof",quantity:20},{name:"Metal Spike",quantity:10}], cost:250000, time:"20h" },

  // ====== MAGIC LEVEL ======
  { id:"basic-epiphany", name:"Epiphany (Basic)", slot:"Helmet", tier:"Basic", category:"Magic Level", effect:"+1 Magic Level", items:[{name:"Elvish Talisman",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-epiphany", name:"Epiphany (Intricate)", slot:"Helmet", tier:"Intricate", category:"Magic Level", effect:"+2 Magic Level", items:[{name:"Elvish Talisman",quantity:25},{name:"Broken Shamanic Staff",quantity:15}], cost:60000, time:"20h" },
  { id:"powerful-epiphany", name:"Epiphany (Powerful)", slot:"Helmet", tier:"Powerful", category:"Magic Level", effect:"+4 Magic Level", items:[{name:"Elvish Talisman",quantity:25},{name:"Broken Shamanic Staff",quantity:15},{name:"Strand of Medusa Hair",quantity:15}], cost:250000, time:"20h" },

  // ====== SWORD ======
  { id:"basic-slash", name:"Slash (Basic)", slot:"Helmet", tier:"Basic", category:"Sword", effect:"+1 Sword Fighting", items:[{name:"Lion's Mane",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-slash", name:"Slash (Intricate)", slot:"Helmet", tier:"Intricate", category:"Sword", effect:"+2 Sword Fighting", items:[{name:"Lion's Mane",quantity:25},{name:"Mooh'tah Shell",quantity:25}], cost:60000, time:"20h" },
  { id:"powerful-slash", name:"Slash (Powerful)", slot:"Helmet", tier:"Powerful", category:"Sword", effect:"+4 Sword Fighting", items:[{name:"Lion's Mane",quantity:25},{name:"Mooh'tah Shell",quantity:25},{name:"War Crystal",quantity:5}], cost:250000, time:"20h" },

  // ====== AXE ======
  { id:"basic-chop", name:"Chop (Basic)", slot:"Helmet", tier:"Basic", category:"Axe", effect:"+1 Axe Fighting", items:[{name:"Orc Tooth",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-chop", name:"Chop (Intricate)", slot:"Helmet", tier:"Intricate", category:"Axe", effect:"+2 Axe Fighting", items:[{name:"Orc Tooth",quantity:25},{name:"Battle Stone",quantity:25}], cost:60000, time:"20h" },
  { id:"powerful-chop", name:"Chop (Powerful)", slot:"Helmet", tier:"Powerful", category:"Axe", effect:"+4 Axe Fighting", items:[{name:"Orc Tooth",quantity:25},{name:"Battle Stone",quantity:25},{name:"Moohtant Horn",quantity:20}], cost:250000, time:"20h" },

  // ====== CLUB ======
  { id:"basic-bash", name:"Bash (Basic)", slot:"Helmet", tier:"Basic", category:"Club", effect:"+1 Club Fighting", items:[{name:"Cyclops Toe",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-bash", name:"Bash (Intricate)", slot:"Helmet", tier:"Intricate", category:"Club", effect:"+2 Club Fighting", items:[{name:"Cyclops Toe",quantity:25},{name:"Ogre Nose Ring",quantity:15}], cost:60000, time:"20h" },
  { id:"powerful-bash", name:"Bash (Powerful)", slot:"Helmet", tier:"Powerful", category:"Club", effect:"+4 Club Fighting", items:[{name:"Cyclops Toe",quantity:25},{name:"Ogre Nose Ring",quantity:15},{name:"Warmaster's Wristguards",quantity:10}], cost:250000, time:"20h" },

  // ====== FIST ======
  { id:"basic-punch", name:"Punch (Basic)", slot:"Helmet", tier:"Basic", category:"Fist", effect:"+1 Fist Fighting", items:[{name:"Tarantula Egg",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-punch", name:"Punch (Intricate)", slot:"Helmet", tier:"Intricate", category:"Fist", effect:"+2 Fist Fighting", items:[{name:"Tarantula Egg",quantity:25},{name:"Mantassin Tail",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-punch", name:"Punch (Powerful)", slot:"Helmet", tier:"Powerful", category:"Fist", effect:"+4 Fist Fighting", items:[{name:"Tarantula Egg",quantity:25},{name:"Mantassin Tail",quantity:20},{name:"Gold-Brocaded Cloth",quantity:15}], cost:250000, time:"20h" },

  // ====== SHIELDING ======
  { id:"basic-blockade", name:"Blockade (Basic)", slot:"Shield", tier:"Basic", category:"Shielding", effect:"+1 Shielding", items:[{name:"Piece of Scarab Shell",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-blockade", name:"Blockade (Intricate)", slot:"Shield", tier:"Intricate", category:"Shielding", effect:"+2 Shielding", items:[{name:"Piece of Scarab Shell",quantity:25},{name:"Brimstone Shell",quantity:25}], cost:60000, time:"20h" },
  { id:"powerful-blockade", name:"Blockade (Powerful)", slot:"Shield", tier:"Powerful", category:"Shielding", effect:"+4 Shielding", items:[{name:"Piece of Scarab Shell",quantity:25},{name:"Brimstone Shell",quantity:25},{name:"Frazzle Skin",quantity:25}], cost:250000, time:"20h" },

  // ====== DEATH PROTECTION ======
  { id:"basic-lich-shroud", name:"Lich Shroud (Basic)", slot:"Armor", tier:"Basic", category:"Death Protection", effect:"-2% Death Damage", items:[{name:"Flask of Embalming Fluid",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-lich-shroud", name:"Lich Shroud (Intricate)", slot:"Armor", tier:"Intricate", category:"Death Protection", effect:"-5% Death Damage", items:[{name:"Flask of Embalming Fluid",quantity:25},{name:"Gloom Wolf Fur",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-lich-shroud", name:"Lich Shroud (Powerful)", slot:"Armor", tier:"Powerful", category:"Death Protection", effect:"-10% Death Damage", items:[{name:"Flask of Embalming Fluid",quantity:25},{name:"Gloom Wolf Fur",quantity:20},{name:"Mystical Hourglass",quantity:5}], cost:250000, time:"20h" },

  // ====== FIRE PROTECTION ======
  { id:"basic-dragon-hide", name:"Dragon Hide (Basic)", slot:"Armor", tier:"Basic", category:"Fire Protection", effect:"-3% Fire Damage", items:[{name:"Green Dragon Scale",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-dragon-hide", name:"Dragon Hide (Intricate)", slot:"Armor", tier:"Intricate", category:"Fire Protection", effect:"-8% Fire Damage", items:[{name:"Green Dragon Scale",quantity:25},{name:"Draken Sulphur",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-dragon-hide", name:"Dragon Hide (Powerful)", slot:"Armor", tier:"Powerful", category:"Fire Protection", effect:"-15% Fire Damage", items:[{name:"Green Dragon Scale",quantity:25},{name:"Draken Sulphur",quantity:20},{name:"White Pale",quantity:5}], cost:250000, time:"20h" },

  // ====== ENERGY PROTECTION ======
  { id:"basic-cloud-fabric", name:"Cloud Fabric (Basic)", slot:"Armor", tier:"Basic", category:"Energy Protection", effect:"-3% Energy Damage", items:[{name:"Wyvern Talisman",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-cloud-fabric", name:"Cloud Fabric (Intricate)", slot:"Armor", tier:"Intricate", category:"Energy Protection", effect:"-8% Energy Damage", items:[{name:"Wyvern Talisman",quantity:25},{name:"Crawler Head Plating",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-cloud-fabric", name:"Cloud Fabric (Powerful)", slot:"Armor", tier:"Powerful", category:"Energy Protection", effect:"-15% Energy Damage", items:[{name:"Wyvern Talisman",quantity:25},{name:"Crawler Head Plating",quantity:20},{name:"White Pale",quantity:5}], cost:250000, time:"20h" },

  // ====== ICE PROTECTION ======
  { id:"basic-quara-scale", name:"Quara Scale (Basic)", slot:"Armor", tier:"Basic", category:"Ice Protection", effect:"-3% Ice Damage", items:[{name:"Winter Wolf Fur",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-quara-scale", name:"Quara Scale (Intricate)", slot:"Armor", tier:"Intricate", category:"Ice Protection", effect:"-8% Ice Damage", items:[{name:"Winter Wolf Fur",quantity:25},{name:"Thick Fur",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-quara-scale", name:"Quara Scale (Powerful)", slot:"Armor", tier:"Powerful", category:"Ice Protection", effect:"-15% Ice Damage", items:[{name:"Winter Wolf Fur",quantity:25},{name:"Thick Fur",quantity:20},{name:"Deeptags",quantity:5}], cost:250000, time:"20h" },

  // ====== EARTH PROTECTION ======
  { id:"basic-snake-skin", name:"Snake Skin (Basic)", slot:"Armor", tier:"Basic", category:"Earth Protection", effect:"-3% Earth Damage", items:[{name:"Piece of Swampling Wood",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-snake-skin", name:"Snake Skin (Intricate)", slot:"Armor", tier:"Intricate", category:"Earth Protection", effect:"-8% Earth Damage", items:[{name:"Piece of Swampling Wood",quantity:25},{name:"Snake Skin",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-snake-skin", name:"Snake Skin (Powerful)", slot:"Armor", tier:"Powerful", category:"Earth Protection", effect:"-15% Earth Damage", items:[{name:"Piece of Swampling Wood",quantity:25},{name:"Snake Skin",quantity:20},{name:"Deeptags",quantity:5}], cost:250000, time:"20h" },

  // ====== HOLY PROTECTION ======
  { id:"basic-demon-presence", name:"Demon Presence (Basic)", slot:"Armor", tier:"Basic", category:"Holy Protection", effect:"-3% Holy Damage", items:[{name:"Cultish Mask",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-demon-presence", name:"Demon Presence (Intricate)", slot:"Armor", tier:"Intricate", category:"Holy Protection", effect:"-8% Holy Damage", items:[{name:"Cultish Mask",quantity:25},{name:"Cultish Robe",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-demon-presence", name:"Demon Presence (Powerful)", slot:"Armor", tier:"Powerful", category:"Holy Protection", effect:"-15% Holy Damage", items:[{name:"Cultish Mask",quantity:25},{name:"Cultish Robe",quantity:20},{name:"Swan Feather Cloak",quantity:5}], cost:250000, time:"20h" },

  // ====== ELEMENTAL DAMAGE WEAPONS ======
  { id:"basic-electrify", name:"Electrify (Basic)", slot:"Helmet", tier:"Basic", category:"Energy Damage", effect:"10% dano físico → Energy", items:[{name:"Rorc Feather",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-electrify", name:"Electrify (Intricate)", slot:"Helmet", tier:"Intricate", category:"Energy Damage", effect:"25% dano físico → Energy", items:[{name:"Rorc Feather",quantity:25},{name:"Peacock Feather Fan",quantity:5}], cost:60000, time:"20h" },
  { id:"powerful-electrify", name:"Electrify (Powerful)", slot:"Helmet", tier:"Powerful", category:"Energy Damage", effect:"50% dano físico → Energy", items:[{name:"Rorc Feather",quantity:25},{name:"Peacock Feather Fan",quantity:5},{name:"Energy Vein",quantity:1}], cost:250000, time:"20h" },

  { id:"basic-frost", name:"Frost (Basic)", slot:"Helmet", tier:"Basic", category:"Ice Damage", effect:"10% dano físico → Ice", items:[{name:"Frosty Heart",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-frost", name:"Frost (Intricate)", slot:"Helmet", tier:"Intricate", category:"Ice Damage", effect:"25% dano físico → Ice", items:[{name:"Frosty Heart",quantity:25},{name:"Seacrest Hair",quantity:10}], cost:60000, time:"20h" },
  { id:"powerful-frost", name:"Frost (Powerful)", slot:"Helmet", tier:"Powerful", category:"Ice Damage", effect:"50% dano físico → Ice", items:[{name:"Frosty Heart",quantity:25},{name:"Seacrest Hair",quantity:10},{name:"Polar Bear Paw",quantity:5}], cost:250000, time:"20h" },

  { id:"basic-reap", name:"Reap (Basic)", slot:"Helmet", tier:"Basic", category:"Death Damage", effect:"10% dano físico → Death", items:[{name:"Pile of Grave Earth",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-reap", name:"Reap (Intricate)", slot:"Helmet", tier:"Intricate", category:"Death Damage", effect:"25% dano físico → Death", items:[{name:"Pile of Grave Earth",quantity:25},{name:"Demonic Skeletal Hand",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-reap", name:"Reap (Powerful)", slot:"Helmet", tier:"Powerful", category:"Death Damage", effect:"50% dano físico → Death", items:[{name:"Pile of Grave Earth",quantity:25},{name:"Demonic Skeletal Hand",quantity:20},{name:"Petrified Scream",quantity:5}], cost:250000, time:"20h" },

  { id:"basic-scorch", name:"Scorch (Basic)", slot:"Helmet", tier:"Basic", category:"Fire Damage", effect:"10% dano físico → Fire", items:[{name:"Fiery Heart",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-scorch", name:"Scorch (Intricate)", slot:"Helmet", tier:"Intricate", category:"Fire Damage", effect:"25% dano físico → Fire", items:[{name:"Fiery Heart",quantity:25},{name:"Green Dragon Scale",quantity:5}], cost:60000, time:"20h" },
  { id:"powerful-scorch", name:"Scorch (Powerful)", slot:"Helmet", tier:"Powerful", category:"Fire Damage", effect:"50% dano físico → Fire", items:[{name:"Fiery Heart",quantity:25},{name:"Green Dragon Scale",quantity:5},{name:"Demon Horn",quantity:5}], cost:250000, time:"20h" },

  { id:"basic-venom", name:"Venom (Basic)", slot:"Helmet", tier:"Basic", category:"Earth Damage", effect:"10% dano físico → Earth", items:[{name:"Swamp Grass",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-venom", name:"Venom (Intricate)", slot:"Helmet", tier:"Intricate", category:"Earth Damage", effect:"25% dano físico → Earth", items:[{name:"Swamp Grass",quantity:25},{name:"Poisonous Slime",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-venom", name:"Venom (Powerful)", slot:"Helmet", tier:"Powerful", category:"Earth Damage", effect:"50% dano físico → Earth", items:[{name:"Swamp Grass",quantity:25},{name:"Poisonous Slime",quantity:20},{name:"Slime Heart",quantity:2}], cost:250000, time:"20h" },
];

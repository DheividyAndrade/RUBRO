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
  icon: string;
  folder: string;
  items: ImbuementItem[];
  cost: number;
  time: string;
}

const IMG = (folder: string, name: string) => `/imbuements/${folder}/${name}.gif`;

export const IMBUEMENTS: Imbuement[] = [
  // ====== MANA LEECH ======
  { id:"basic-void", name:"Void (Basic)", slot:"Helmet", tier:"Basic", category:"Mana Leech", effect:"3% do dano vira Mana", icon:IMG("void","Void"), folder:"void", items:[{name:"Rope Belt",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-void", name:"Void (Intricate)", slot:"Helmet", tier:"Intricate", category:"Mana Leech", effect:"5% do dano vira Mana", icon:IMG("void","Void"), folder:"void", items:[{name:"Rope Belt",quantity:25},{name:"Silencer Claws",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-void", name:"Void (Powerful)", slot:"Helmet", tier:"Powerful", category:"Mana Leech", effect:"8% do dano vira Mana", icon:IMG("void","Void"), folder:"void", items:[{name:"Rope Belt",quantity:25},{name:"Silencer Claws",quantity:20},{name:"Some Grimeleech Wings",quantity:5}], cost:250000, time:"20h" },

  // ====== LIFE LEECH ======
  { id:"basic-vampirism", name:"Vampirism (Basic)", slot:"Helmet", tier:"Basic", category:"Life Leech", effect:"5% do dano vira HP", icon:IMG("Vampirism","Vampirism"), folder:"Vampirism", items:[{name:"Vampire Teeth",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-vampirism", name:"Vampirism (Intricate)", slot:"Helmet", tier:"Intricate", category:"Life Leech", effect:"10% do dano vira HP", icon:IMG("Vampirism","Vampirism"), folder:"Vampirism", items:[{name:"Vampire Teeth",quantity:25},{name:"Bloody Pincers",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-vampirism", name:"Vampirism (Powerful)", slot:"Helmet", tier:"Powerful", category:"Life Leech", effect:"25% do dano vira HP", icon:IMG("Vampirism","Vampirism"), folder:"Vampirism", items:[{name:"Vampire Teeth",quantity:25},{name:"Bloody Pincers",quantity:20},{name:"Piece of Dead Brain",quantity:5}], cost:250000, time:"20h" },

  // ====== CRITICAL ======
  { id:"basic-strike", name:"Strike (Basic)", slot:"Helmet", tier:"Basic", category:"Critical", effect:"+15% dano crítico", icon:IMG("Strike","Strike"), folder:"Strike", items:[{name:"Protective Charm",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-strike", name:"Strike (Intricate)", slot:"Helmet", tier:"Intricate", category:"Critical", effect:"+25% dano crítico", icon:IMG("Strike","Strike"), folder:"Strike", items:[{name:"Protective Charm",quantity:25},{name:"Sabreteeth",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-strike", name:"Strike (Powerful)", slot:"Helmet", tier:"Powerful", category:"Critical", effect:"+50% dano crítico", icon:IMG("Strike","Strike"), folder:"Strike", items:[{name:"Protective Charm",quantity:25},{name:"Sabreteeth",quantity:20},{name:"Vexclaw Talon",quantity:5}], cost:250000, time:"20h" },

  // ====== DISTANCE ======
  { id:"basic-precision", name:"Precision (Basic)", slot:"Helmet", tier:"Basic", category:"Distance", effect:"+1 Distance Fighting", icon:IMG("Precision","Precision"), folder:"Precision", items:[{name:"Elven Scouting Glass",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-precision", name:"Precision (Intricate)", slot:"Helmet", tier:"Intricate", category:"Distance", effect:"+2 Distance Fighting", icon:IMG("Precision","Precision"), folder:"Precision", items:[{name:"Elven Scouting Glass",quantity:25},{name:"Elven Hoof",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-precision", name:"Precision (Powerful)", slot:"Helmet", tier:"Powerful", category:"Distance", effect:"+4 Distance Fighting", icon:IMG("Precision","Precision"), folder:"Precision", items:[{name:"Elven Scouting Glass",quantity:25},{name:"Elven Hoof",quantity:20},{name:"Metal Spike",quantity:10}], cost:250000, time:"20h" },

  // ====== MAGIC LEVEL ======
  { id:"basic-epiphany", name:"Epiphany (Basic)", slot:"Helmet", tier:"Basic", category:"Magic Level", effect:"+1 Magic Level", icon:IMG("Epiphany","Epiphany"), folder:"Epiphany", items:[{name:"Elvish Talisman",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-epiphany", name:"Epiphany (Intricate)", slot:"Helmet", tier:"Intricate", category:"Magic Level", effect:"+2 Magic Level", icon:IMG("Epiphany","Epiphany"), folder:"Epiphany", items:[{name:"Elvish Talisman",quantity:25},{name:"Broken Shamanic Staff",quantity:15}], cost:60000, time:"20h" },
  { id:"powerful-epiphany", name:"Epiphany (Powerful)", slot:"Helmet", tier:"Powerful", category:"Magic Level", effect:"+4 Magic Level", icon:IMG("Epiphany","Epiphany"), folder:"Epiphany", items:[{name:"Elvish Talisman",quantity:25},{name:"Broken Shamanic Staff",quantity:15},{name:"Strand of Medusa Hair",quantity:15}], cost:250000, time:"20h" },

  // ====== SWORD ======
  { id:"basic-slash", name:"Slash (Basic)", slot:"Helmet", tier:"Basic", category:"Sword", effect:"+1 Sword Fighting", icon:IMG("Slash","Slash"), folder:"Slash", items:[{name:"Lion's Mane",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-slash", name:"Slash (Intricate)", slot:"Helmet", tier:"Intricate", category:"Sword", effect:"+2 Sword Fighting", icon:IMG("Slash","Slash"), folder:"Slash", items:[{name:"Lion's Mane",quantity:25},{name:"Mooh'tah Shell",quantity:25}], cost:60000, time:"20h" },
  { id:"powerful-slash", name:"Slash (Powerful)", slot:"Helmet", tier:"Powerful", category:"Sword", effect:"+4 Sword Fighting", icon:IMG("Slash","Slash"), folder:"Slash", items:[{name:"Lion's Mane",quantity:25},{name:"Mooh'tah Shell",quantity:25},{name:"War Crystal",quantity:5}], cost:250000, time:"20h" },

  // ====== AXE ======
  { id:"basic-chop", name:"Chop (Basic)", slot:"Helmet", tier:"Basic", category:"Axe", effect:"+1 Axe Fighting", icon:IMG("Chop","Chop"), folder:"Chop", items:[{name:"Orc Tooth",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-chop", name:"Chop (Intricate)", slot:"Helmet", tier:"Intricate", category:"Axe", effect:"+2 Axe Fighting", icon:IMG("Chop","Chop"), folder:"Chop", items:[{name:"Orc Tooth",quantity:25},{name:"Battle Stone",quantity:25}], cost:60000, time:"20h" },
  { id:"powerful-chop", name:"Chop (Powerful)", slot:"Helmet", tier:"Powerful", category:"Axe", effect:"+4 Axe Fighting", icon:IMG("Chop","Chop"), folder:"Chop", items:[{name:"Orc Tooth",quantity:25},{name:"Battle Stone",quantity:25},{name:"Moohtant Horn",quantity:20}], cost:250000, time:"20h" },

  // ====== CLUB ======
  { id:"basic-bash", name:"Bash (Basic)", slot:"Helmet", tier:"Basic", category:"Club", effect:"+1 Club Fighting", icon:IMG("Bash","Bash"), folder:"Bash", items:[{name:"Cyclops Toe",quantity:20}], cost:7500, time:"20h" },
  { id:"intricate-bash", name:"Bash (Intricate)", slot:"Helmet", tier:"Intricate", category:"Club", effect:"+2 Club Fighting", icon:IMG("Bash","Bash"), folder:"Bash", items:[{name:"Cyclops Toe",quantity:25},{name:"Ogre Nose Ring",quantity:15}], cost:60000, time:"20h" },
  { id:"powerful-bash", name:"Bash (Powerful)", slot:"Helmet", tier:"Powerful", category:"Club", effect:"+4 Club Fighting", icon:IMG("Bash","Bash"), folder:"Bash", items:[{name:"Cyclops Toe",quantity:25},{name:"Ogre Nose Ring",quantity:15},{name:"Warmaster's Wristguards",quantity:10}], cost:250000, time:"20h" },

  // ====== FIST ======
  { id:"basic-punch", name:"Punch (Basic)", slot:"Helmet", tier:"Basic", category:"Fist", effect:"+1 Fist Fighting", icon:IMG("Punch","Punch"), folder:"Punch", items:[{name:"Tarantula Egg",quantity:25}], cost:7500, time:"20h" },
  { id:"intricate-punch", name:"Punch (Intricate)", slot:"Helmet", tier:"Intricate", category:"Fist", effect:"+2 Fist Fighting", icon:IMG("Punch","Punch"), folder:"Punch", items:[{name:"Tarantula Egg",quantity:25},{name:"Mantassin Tail",quantity:20}], cost:60000, time:"20h" },
  { id:"powerful-punch", name:"Punch (Powerful)", slot:"Helmet", tier:"Powerful", category:"Fist", effect:"+4 Fist Fighting", icon:IMG("Punch","Punch"), folder:"Punch", items:[{name:"Tarantula Egg",quantity:25},{name:"Mantassin Tail",quantity:20},{name:"Gold-Brocaded Cloth",quantity:15}], cost:250000, time:"20h" },
];

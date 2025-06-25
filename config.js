// Game Configuration
const GAME_CONFIG = {
  MODULES: {
    CRYPTO: "crypto",
    ARCADE: "arcade",
    BURGER: "burger",
    COW: "cow",
    BAKERY: "bakery",
    NFT: "nft",
  },
  // Currency settings
  CURRENCIES: {
    DUCKCOIN: "duckcoin",
    DOLLARS: "dollars",
  },

  // Exchange rate settings
  EXCHANGE_RATES: {
    DUCK_TO_DOLLAR_MIN: 2,
    DUCK_TO_DOLLAR_MAX: 10,
    DUCK_TO_DOLLAR_START: 3,
    FLUCTUATION_INTERVAL: 15000, // 15 seconds
    FLUCTUATION_AMOUNT: 0.4, // ±20% change
  },

  // Crypto mining settings
  CRYPTO_MINING: {
    INITIAL_DRIPS_PER_TAP: 1,
    INITIAL_TAPS: 1,
    MAX_TAPS: 5,
    INITIAL_COOLDOWN: 3000, // 3 seconds
    MIN_COOLDOWN: 500, // 0.5 seconds minimum
    COOLDOWN_REDUCTION: 10, // 0.01 seconds = 10ms

    UPGRADE_COSTS: {
      DRIP_START: 5,
      DRIP_MULTIPLIER: 1.5,
      TAP_START: 20,
      TAP_MULTIPLIER: 2,
      COOLDOWN_START: 15,
      COOLDOWN_MULTIPLIER: 1.3,
    },
  },

  // Arcade repair settings
  ARCADE_REPAIR: {
    CPU_COST: 10,
    MACHINE_INVESTMENT: 10,
    INITIAL_SALE_SLOTS: 1,
    MAX_SALE_SLOTS: 4,
    SLOT_BASE_COST: 50,

    OFFER_GENERATION: {
      MIN_INTERVAL: 10000, // 10 seconds
      MAX_INTERVAL: 20000, // 20 seconds
      OFFER_CHANCE: 0.7, // 70% chance per cycle
      MIN_MULTIPLIER: 0.5,
      MAX_MULTIPLIER: 3.0,
    },
  },

  // Module unlock requirements
  MODULE_UNLOCKS: {
    CRYPTO: null, // Always unlocked
    ARCADE: { dollars: 50 },
    BURGER: { dollars: 200 },
    COWS: { dollars: 300 },
    BAKERY: { dollars: 500 },
    NFT: { dollars: 1000 },
  },

  // UI settings
  UI: {
    NOTIFICATION_DURATION: 3000,
    ANIMATION_DURATION: 1000,
    RENDER_INTERVALS: {
      COOLDOWN_UPDATE: 1000, // 1 second
    },
  },
};

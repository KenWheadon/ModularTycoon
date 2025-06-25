// Main Game Class
class Game {
  constructor() {
    this.currencyManager = new CurrencyManager();
    this.moduleManager = new ModuleManager(this.currencyManager);
    this.render();
  }

  // Render entire game
  render() {
    this.currencyManager.renderCurrencyDisplay();
    this.moduleManager.renderModules();
  }
}

// Global Utility Functions
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, GAME_CONFIG.UI.NOTIFICATION_DURATION);
}

// Global variables for module access
let game,
  cryptoModule,
  arcadeModule,
  burgerModule,
  cowModule,
  bakeryModule,
  moduleManager;

// Initialize game when page loads
window.onload = function () {
  // Initialize game
  game = new Game();
  moduleManager = game.moduleManager;

  // Get module references for global access
  cryptoModule = moduleManager.getModule(GAME_CONFIG.MODULES.CRYPTO);
  arcadeModule = moduleManager.getModule(GAME_CONFIG.MODULES.ARCADE);
  burgerModule = moduleManager.getModule(GAME_CONFIG.MODULES.BURGER);
  cowModule = moduleManager.getModule(GAME_CONFIG.MODULES.COWS);
  bakeryModule = moduleManager.getModule(GAME_CONFIG.MODULES.BAKERY);
  nftModule = moduleManager.getModule(GAME_CONFIG.MODULES.NFT);

  // Make game accessible globally
  window.game = game;
  window.moduleManager = moduleManager;
  window.cryptoModule = cryptoModule;
  window.arcadeModule = arcadeModule;
  window.burgerModule = burgerModule;
  window.cowModule = cowModule;
  window.bakeryModule = bakeryModule;
  window.nftModule = nftModule;
  window.showNotification = showNotification;

  console.log("🎮 Modular Tycoon Game Initialized!");
};

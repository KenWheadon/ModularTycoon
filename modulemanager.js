// Module Manager Class
class ModuleManager {
  constructor(currencyManager) {
    this.currencyManager = currencyManager;
    this.modules = [];
    this.unlockedModules = ["crypto"];
    this.initializeModules();
  }

  // Initialize all modules
  initializeModules() {
    // Module 1: Crypto Mining (always unlocked)
    this.modules.push(new CryptoMiningModule());

    // Module 2: Arcade Repair
    this.modules.push(new ArcadeRepairModule());

    // Module 3: Burger Flipping
    this.modules.push(new BurgerFlippingModule());

    // Module 4: Bakery (placeholder)
    this.modules.push(new BakeryModule());
  }

  // Check if module is unlocked
  isModuleUnlocked(moduleId) {
    return this.unlockedModules.includes(moduleId);
  }

  // Unlock module
  unlockModule(moduleId) {
    if (!this.unlockedModules.includes(moduleId)) {
      const module = this.modules.find((m) => m.id === moduleId);
      if (module && module.unlockRequirement) {
        if (this.currencyManager.spend(module.unlockRequirement.cost)) {
          this.unlockedModules.push(moduleId);
          return true;
        }
      }
    }
    return false;
  }

  // Render all modules
  renderModules() {
    const container = document.getElementById("modulesContainer");
    if (!container) return;

    container.innerHTML = "";

    this.modules.forEach((module) => {
      const moduleDiv = module.render(this);
      container.appendChild(moduleDiv);
    });
  }

  // Get module by ID
  getModule(moduleId) {
    return this.modules.find((m) => m.id === moduleId);
  }
}

// Base Game Module Class
class GameModule {
  constructor(id, name, icon, unlockRequirement) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.unlockRequirement = unlockRequirement;
  }

  // Render module
  render(moduleManager) {
    const div = document.createElement("div");
    div.className = `module ${
      moduleManager.isModuleUnlocked(this.id) ? "" : "locked"
    }`;

    if (moduleManager.isModuleUnlocked(this.id)) {
      div.innerHTML = this.renderContent(moduleManager);
    } else {
      div.innerHTML = this.renderLocked(moduleManager);
    }

    return div;
  }

  // Render locked module
  renderLocked(moduleManager) {
    const canUnlock =
      this.unlockRequirement &&
      moduleManager.currencyManager.canAfford(this.unlockRequirement.cost);

    return `
            <h2>${this.icon} ${this.name}</h2>
            <div class="unlock-module">
                <p>${
                  this.unlockRequirement
                    ? this.unlockRequirement.description
                    : "Requirements not met"
                }</p>
                <button class="unlock-button" 
                        onclick="this.handleUnlock('${this.id}')"
                        ${canUnlock ? "" : "disabled"}>
                    Unlock Module
                </button>
            </div>
        `;
  }

  // Handle module unlock
  handleUnlock(moduleId) {
    if (window.moduleManager && window.moduleManager.unlockModule(moduleId)) {
      window.showNotification(`${this.name} module unlocked!`);
      window.game.render();
    }
  }

  // Abstract method - must be implemented by subclasses
  renderContent(moduleManager) {
    throw new Error("renderContent must be implemented by subclass");
  }
}

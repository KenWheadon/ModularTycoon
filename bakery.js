// Bakery Module
class BakeryModule extends GameModule {
  constructor() {
    super("bakery", "Bakery Shop", "🥖", {
      cost: GAME_CONFIG.MODULE_UNLOCKS.BAKERY,
      description: "Unlock bakery for $500",
    });

    // Ingredients needed for bread
    this.ingredients = {
      flour: 0,
      water: 0,
      yeast: 0,
    };

    // Ingredient costs
    this.ingredientCosts = {
      flour: 3, // $3 per flour
      water: 1, // $1 per water
      yeast: 2, // $2 per yeast
    };

    // Baking system
    this.bakingSlots = 1; // Start with 1 baking slot
    this.maxBakingSlots = 3; // Max 3 baking slots
    this.activeBakes = []; // Array of baking breads

    // Sales system
    this.saleSlots = 1; // Start with 1 sale slot
    this.maxSaleSlots = 3; // Max 3 sale slots
    this.breadsForSale = []; // Array of breads for sale

    // Upgrade costs
    this.bakingSlotCost = 100; // Cost for additional baking slot
    this.saleSlotCost = 50; // Cost for additional sale slot

    // Timing constants
    this.bakingTime = 10000; // 10 seconds to bake
    this.minSaleTime = 5000; // 5 seconds minimum to sell
    this.maxSaleTime = 20000; // 20 seconds maximum to sell

    this.startSaleSystem();
  }

  // Start automatic sale system
  startSaleSystem() {
    setInterval(() => {
      this.processSales();
    }, 1000); // Check every second
  }

  // Process automatic bread sales
  processSales() {
    this.breadsForSale.forEach((bread, index) => {
      if (bread && Date.now() >= bread.sellTime) {
        // Sell the bread
        window.game.currencyManager.addCurrency("dollars", bread.salePrice);
        window.showNotification(`Bread sold for $${bread.salePrice}!`);

        // Remove from sale slot
        this.breadsForSale[index] = null;

        // Re-render to update display
        if (window.game) {
          window.game.render();
        }
      }
    });
  }

  // Calculate bread ingredient cost
  getBreadIngredientCost() {
    return (
      this.ingredientCosts.flour +
      this.ingredientCosts.water +
      this.ingredientCosts.yeast
    );
  }

  // Check if can make bread
  canMakeBread() {
    return (
      this.ingredients.flour >= 1 &&
      this.ingredients.water >= 1 &&
      this.ingredients.yeast >= 1 &&
      this.getActiveBakes() < this.bakingSlots
    );
  }

  // Get number of active bakes
  getActiveBakes() {
    return this.activeBakes.filter((bake) => bake !== null).length;
  }

  // Get number of breads for sale
  getBreadsForSale() {
    return this.breadsForSale.filter((bread) => bread !== null).length;
  }

  // Render module content
  renderContent(moduleManager) {
    const breadCost = this.getBreadIngredientCost();
    const breadSalePrice = Math.floor(breadCost * 1.5);

    return `
            <h2>${this.icon} ${this.name}</h2>
            <div class="module-stats">
                <div class="stat">
                    <div class="stat-label">🌾 Flour</div>
                    <div class="stat-value">${this.ingredients.flour}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">💧 Water</div>
                    <div class="stat-value">${this.ingredients.water}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">🦠 Yeast</div>
                    <div class="stat-value">${this.ingredients.yeast}</div>
                </div>
            </div>
            
            <div class="action-area">
                <div class="ingredients-section">
                    <h3>Buy Ingredients</h3>
                    <div class="upgrades">
                        <div class="upgrade">
                            <span>Flour - $${this.ingredientCosts.flour}</span>
                            <button onclick="window.bakeryModule.buyIngredient('flour')" 
                                    ${
                                      moduleManager.currencyManager.getCurrency(
                                        "dollars"
                                      ) >= this.ingredientCosts.flour
                                        ? ""
                                        : "disabled"
                                    }>
                                Buy
                            </button>
                        </div>
                        <div class="upgrade">
                            <span>Water - $${this.ingredientCosts.water}</span>
                            <button onclick="window.bakeryModule.buyIngredient('water')" 
                                    ${
                                      moduleManager.currencyManager.getCurrency(
                                        "dollars"
                                      ) >= this.ingredientCosts.water
                                        ? ""
                                        : "disabled"
                                    }>
                                Buy
                            </button>
                        </div>
                        <div class="upgrade">
                            <span>Yeast - $${this.ingredientCosts.yeast}</span>
                            <button onclick="window.bakeryModule.buyIngredient('yeast')" 
                                    ${
                                      moduleManager.currencyManager.getCurrency(
                                        "dollars"
                                      ) >= this.ingredientCosts.yeast
                                        ? ""
                                        : "disabled"
                                    }>
                                Buy
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="baking-section">
                    <h3>Baking (${this.getActiveBakes()}/${
      this.bakingSlots
    } slots)</h3>
                    <div class="baking-info">
                        <div>Cost: $${breadCost} | Sale Price: $${breadSalePrice} | Profit: $${
      breadSalePrice - breadCost
    }</div>
                    </div>
                    <button class="bake-button" onclick="window.bakeryModule.startBaking()" 
                            ${this.canMakeBread() ? "" : "disabled"}>
                        🥖 BAKE BREAD (10s)
                    </button>
                    <div class="baking-slots">
                        ${this.renderBakingSlots()}
                    </div>
                </div>
            </div>
            
            <div class="sales-section">
                <h3>Bread for Sale (${this.getBreadsForSale()}/${
      this.saleSlots
    } slots)</h3>
                <div class="sale-slots">
                    ${this.renderSaleSlots()}
                </div>
            </div>
            
            <div class="upgrades">
                <div class="upgrade">
                    <span>Buy Baking Slot (Max ${this.maxBakingSlots}) - $${
      this.bakingSlotCost
    }</span>
                    <button onclick="window.bakeryModule.buyBakingSlot()" 
                            ${
                              moduleManager.currencyManager.getCurrency(
                                "dollars"
                              ) >= this.bakingSlotCost &&
                              this.bakingSlots < this.maxBakingSlots
                                ? ""
                                : "disabled"
                            }>
                        ${
                          this.bakingSlots >= this.maxBakingSlots
                            ? "Max Slots"
                            : "Buy"
                        }
                    </button>
                </div>
                <div class="upgrade">
                    <span>Buy Sale Slot (Max ${this.maxSaleSlots}) - $${
      this.saleSlotCost
    }</span>
                    <button onclick="window.bakeryModule.buySaleSlot()" 
                            ${
                              moduleManager.currencyManager.getCurrency(
                                "dollars"
                              ) >= this.saleSlotCost &&
                              this.saleSlots < this.maxSaleSlots
                                ? ""
                                : "disabled"
                            }>
                        ${
                          this.saleSlots >= this.maxSaleSlots
                            ? "Max Slots"
                            : "Buy"
                        }
                    </button>
                </div>
            </div>
        `;
  }

  // Render baking slots
  renderBakingSlots() {
    let html = '<div class="baking-slots-grid">';

    for (let i = 0; i < this.bakingSlots; i++) {
      const bake = this.activeBakes[i];
      if (bake) {
        const timeLeft = Math.ceil((bake.finishTime - Date.now()) / 1000);
        html += `
                    <div class="baking-slot active">
                        <div class="baking-bread">🥖</div>
                        <div class="baking-timer">${
                          timeLeft > 0 ? `${timeLeft}s` : "Ready!"
                        }</div>
                        ${
                          timeLeft <= 0
                            ? `<button onclick="window.bakeryModule.collectBread(${i})">Collect</button>`
                            : ""
                        }
                    </div>
                `;
      } else {
        html += `
                    <div class="baking-slot empty">
                        <div class="empty-slot">🔥 Empty Oven</div>
                    </div>
                `;
      }
    }

    html += "</div>";
    return html;
  }

  // Render sale slots
  renderSaleSlots() {
    let html = '<div class="sale-slots-grid">';

    for (let i = 0; i < this.saleSlots; i++) {
      const bread = this.breadsForSale[i];
      if (bread) {
        const timeLeft = Math.ceil((bread.sellTime - Date.now()) / 1000);
        html += `
                    <div class="sale-slot occupied">
                        <div class="bread-for-sale">🥖 $${bread.salePrice}</div>
                        <div class="sale-timer">Sells in ${timeLeft}s</div>
                    </div>
                `;
      } else {
        html += `
                    <div class="sale-slot empty">
                        <div class="empty-slot">📦 Empty Shelf</div>
                    </div>
                `;
      }
    }

    html += "</div>";
    return html;
  }

  // Buy ingredient
  buyIngredient(type) {
    const cost = this.ingredientCosts[type];
    if (window.game.currencyManager.spend({ dollars: cost })) {
      this.ingredients[type]++;
      window.showNotification(
        `${type.charAt(0).toUpperCase() + type.slice(1)} purchased!`
      );
      window.game.render();
    }
  }

  // Start baking bread
  startBaking() {
    if (!this.canMakeBread()) return;

    // Use ingredients
    this.ingredients.flour--;
    this.ingredients.water--;
    this.ingredients.yeast--;

    // Find empty baking slot
    const emptySlot = this.activeBakes.findIndex(
      (slot) => slot === null || slot === undefined
    );
    const slotIndex = emptySlot >= 0 ? emptySlot : this.activeBakes.length;

    // Start baking
    this.activeBakes[slotIndex] = {
      finishTime: Date.now() + this.bakingTime,
      ingredientCost: this.getBreadIngredientCost(),
    };

    window.showNotification("Bread is baking! 🥖");
    this.startBakingTimer(slotIndex);
    window.game.render();
  }

  // Start baking timer
  startBakingTimer(slotIndex) {
    const updateTimer = () => {
      const bake = this.activeBakes[slotIndex];
      if (bake && Date.now() < bake.finishTime) {
        window.game.render();
        setTimeout(updateTimer, 1000);
      } else if (bake) {
        window.showNotification("Bread is ready to collect! 🥖");
        window.game.render();
      }
    };

    setTimeout(updateTimer, 1000);
  }

  // Collect finished bread
  collectBread(slotIndex) {
    const bake = this.activeBakes[slotIndex];
    if (!bake || Date.now() < bake.finishTime) return;

    // Find empty sale slot
    const emptySaleSlot = this.breadsForSale.findIndex(
      (slot) => slot === null || slot === undefined
    );
    if (emptySaleSlot >= 0 || this.breadsForSale.length < this.saleSlots) {
      const saleSlotIndex =
        emptySaleSlot >= 0 ? emptySaleSlot : this.breadsForSale.length;

      // Calculate sale price and time
      const salePrice = Math.floor(bake.ingredientCost * 1.5);
      const saleTime =
        Date.now() +
        Math.random() * (this.maxSaleTime - this.minSaleTime) +
        this.minSaleTime;

      // Put bread for sale
      this.breadsForSale[saleSlotIndex] = {
        salePrice: salePrice,
        sellTime: saleTime,
      };

      // Remove from baking slot
      this.activeBakes[slotIndex] = null;

      window.showNotification(
        `Fresh bread put up for sale! Will sell for $${salePrice}`
      );
      window.game.render();
    } else {
      window.showNotification(
        "No empty sale slots! Buy more sale slots first."
      );
    }
  }

  // Buy baking slot
  buyBakingSlot() {
    if (
      window.game.currencyManager.spend({ dollars: this.bakingSlotCost }) &&
      this.bakingSlots < this.maxBakingSlots
    ) {
      this.bakingSlots++;
      this.bakingSlotCost = Math.floor(this.bakingSlotCost * 1.5); // Increase cost
      window.showNotification("New baking slot purchased!");
      window.game.render();
    }
  }

  // Buy sale slot
  buySaleSlot() {
    if (
      window.game.currencyManager.spend({ dollars: this.saleSlotCost }) &&
      this.saleSlots < this.maxSaleSlots
    ) {
      this.saleSlots++;
      this.saleSlotCost = Math.floor(this.saleSlotCost * 1.5); // Increase cost
      window.showNotification("New sale slot purchased!");
      window.game.render();
    }
  }
}

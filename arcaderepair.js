// Arcade Repair Module
class ArcadeRepairModule extends GameModule {
  constructor() {
    super("arcade", "Arcade Repair", "🕹️", {
      cost: GAME_CONFIG.MODULE_UNLOCKS.ARCADE,
      description: "Unlock arcade repair shop for $50",
    });

    const config = GAME_CONFIG.ARCADE_REPAIR;
    this.cpuParts = 0;
    this.reputation = 0;
    this.saleSlots = config.INITIAL_SALE_SLOTS;
    this.maxSaleSlots = config.MAX_SALE_SLOTS;
    this.machines = []; // {investment: 10, hasOffer: false, offer: 0, offerTime: 0}
    this.slotBaseCost = config.SLOT_BASE_COST;

    this.startOfferSystem();
  }

  // Start offer generation system
  startOfferSystem() {
    const generateOffers = () => {
      const config = GAME_CONFIG.ARCADE_REPAIR.OFFER_GENERATION;
      const interval =
        Math.random() * (config.MAX_INTERVAL - config.MIN_INTERVAL) +
        config.MIN_INTERVAL;

      setTimeout(() => {
        this.generateOffers();
        generateOffers(); // Schedule next generation
      }, interval);
    };

    generateOffers();
  }

  // Generate offers for machines
  generateOffers() {
    const config = GAME_CONFIG.ARCADE_REPAIR.OFFER_GENERATION;

    this.machines.forEach((machine) => {
      if (!machine.hasOffer && Math.random() < config.OFFER_CHANCE) {
        const multiplier =
          Math.random() * (config.MAX_MULTIPLIER - config.MIN_MULTIPLIER) +
          config.MIN_MULTIPLIER;
        machine.offer = Math.floor(machine.investment * multiplier);
        machine.hasOffer = true;
        machine.offerTime = Date.now();

        // Re-render to show new offer
        if (window.game) {
          window.game.render();
        }
      }
    });
  }

  // Render module content
  renderContent(moduleManager) {
    return `
            <h2>${this.icon} ${this.name}</h2>
            <div class="module-stats">
                <div class="stat">
                    <div class="stat-label">CPU Parts</div>
                    <div class="stat-value">${this.cpuParts}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Reputation</div>
                    <div class="stat-value">${this.reputation}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Sale Slots</div>
                    <div class="stat-value">${this.saleSlots}/${
      this.maxSaleSlots
    }</div>
                </div>
            </div>
            
            <div class="action-area">
                <div class="upgrades">
                    <div class="upgrade">
                        <span>Buy CPU Part - $${
                          GAME_CONFIG.ARCADE_REPAIR.CPU_COST
                        }</span>
                        <button onclick="window.arcadeModule.buyCPU()" 
                                ${
                                  moduleManager.currencyManager.getCurrency(
                                    "dollars"
                                  ) >= GAME_CONFIG.ARCADE_REPAIR.CPU_COST
                                    ? ""
                                    : "disabled"
                                }>
                            Buy
                        </button>
                    </div>
                    <div class="upgrade">
                        <span>Build Arcade Machine - 1 CPU Part</span>
                        <button onclick="window.arcadeModule.buildMachine()" 
                                ${
                                  this.cpuParts >= 1 &&
                                  this.machines.length < this.saleSlots
                                    ? ""
                                    : "disabled"
                                }>
                            Build
                        </button>
                    </div>
                    <div class="upgrade">
                        <span>Buy Sale Slot - $${
                          this.slotBaseCost * this.saleSlots
                        }</span>
                        <button onclick="window.arcadeModule.buySaleSlot()" 
                                ${
                                  moduleManager.currencyManager.getCurrency(
                                    "dollars"
                                  ) >=
                                    this.slotBaseCost * this.saleSlots &&
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
            </div>
            
            <div class="sale-slots">
                ${this.renderSaleSlots()}
            </div>
        `;
  }

  // Render sale slots
  renderSaleSlots() {
    let html = '<div class="sale-slots-grid">';

    for (let i = 0; i < this.saleSlots; i++) {
      const machine = this.machines[i];
      if (machine) {
        const profitColor =
          machine.offer > machine.investment
            ? "#00ff9f"
            : machine.offer < machine.investment
            ? "#ff6b6b"
            : "#ffd93d";
        const profitText =
          machine.offer > machine.investment
            ? "PROFIT"
            : machine.offer < machine.investment
            ? "LOSS"
            : "BREAK EVEN";

        html += `
                    <div class="machine-slot occupied">
                        <div class="machine-info">
                            <div>🕹️ Arcade Machine</div>
                            <div class="machine-investment">Investment: $${
                              machine.investment
                            }</div>
                        </div>
                        ${
                          machine.hasOffer
                            ? `
                            <div class="offer-section">
                                <div class="offer-amount" style="color: ${profitColor};">
                                    Offer: $${machine.offer}
                                </div>
                                <div class="offer-status" style="color: ${profitColor};">
                                    ${profitText}
                                </div>
                                <div class="offer-buttons">
                                    <button class="accept-btn" onclick="window.arcadeModule.acceptOffer(${i})">
                                        Accept
                                    </button>
                                    <button class="reject-btn" onclick="window.arcadeModule.rejectOffer(${i})">
                                        Reject
                                    </button>
                                </div>
                            </div>
                        `
                            : `
                            <div class="waiting-offer">
                                <div class="waiting-text">⏳ Waiting for offer...</div>
                            </div>
                        `
                        }
                    </div>
                `;
      } else {
        html += `
                    <div class="machine-slot empty">
                        <div class="empty-slot-text">📦 Empty Slot</div>
                    </div>
                `;
      }
    }

    html += "</div>";
    return html;
  }

  // Buy CPU part
  buyCPU() {
    const cost = GAME_CONFIG.ARCADE_REPAIR.CPU_COST;
    if (window.game.currencyManager.spend({ dollars: cost })) {
      this.cpuParts++;
      window.showNotification("CPU part purchased!");
      window.game.render();
    }
  }

  // Build machine
  buildMachine() {
    if (this.cpuParts >= 1 && this.machines.length < this.saleSlots) {
      this.cpuParts--;
      this.machines.push({
        investment: GAME_CONFIG.ARCADE_REPAIR.MACHINE_INVESTMENT,
        hasOffer: false,
        offer: 0,
        offerTime: 0,
      });
      window.showNotification("Arcade machine built and put up for sale!");
      window.game.render();
    }
  }

  // Buy sale slot
  buySaleSlot() {
    const cost = this.slotBaseCost * this.saleSlots;
    if (
      window.game.currencyManager.spend({ dollars: cost }) &&
      this.saleSlots < this.maxSaleSlots
    ) {
      this.saleSlots++;
      window.showNotification("New sale slot purchased!");
      window.game.render();
    }
  }

  // Accept offer
  acceptOffer(slotIndex) {
    const machine = this.machines[slotIndex];
    if (machine && machine.hasOffer) {
      window.game.currencyManager.addCurrency("dollars", machine.offer);
      this.reputation++;

      const profit = machine.offer - machine.investment;
      const profitText =
        profit > 0
          ? `+$${profit} profit!`
          : profit < 0
          ? `$${Math.abs(profit)} loss`
          : "broke even";

      window.showNotification(
        `Machine sold for $${machine.offer}! ${profitText}`
      );

      // Remove machine from slot
      this.machines.splice(slotIndex, 1);
      window.game.render();
    }
  }

  // Reject offer
  rejectOffer(slotIndex) {
    const machine = this.machines[slotIndex];
    if (machine) {
      machine.hasOffer = false;
      machine.offer = 0;
      window.game.render();
    }
  }
}

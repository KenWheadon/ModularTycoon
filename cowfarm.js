// Cow Farm Module
class CowFarmModule extends GameModule {
  constructor() {
    super(GAME_CONFIG.MODULES.COW, "Cow Farm", "🐄", {
      cost: GAME_CONFIG.MODULE_UNLOCKS.COWS,
      description: "Unlock cow farm for $300",
    });

    // Resources
    this.hayBales = 0;
    this.milkBottles = 0;
    this.totalMilkProduced = 0;

    // Cows array
    this.cows = []; // {id, status, gasCount, milkLevel, lastMilkTime, eatStartTime, cooldownEndTime}
    this.nextCowId = 1;
    this.maxCows = 6;

    // Game settings
    this.cowCost = 25;
    this.hayBalesCost = 3; // per 10 bales
    this.milkSellPrice = 4;
    this.cowEatingTime = 8000; // 8 seconds to eat hay
    this.cowCooldownTime = 30000; // 30 seconds cooldown
    this.maxGasCount = 3;
    this.maxMilkLevel = 100;

    // Cow states: 'idle', 'eating', 'gassy', 'ready_to_milk', 'being_milked', 'cooldown'

    this.startMilkSelling();
  }

  renderContent(moduleManager) {
    return `
            <h2>${this.icon} ${this.name}</h2>
            <div class="module-stats">
                <div class="stat">
                    <div class="stat-label">Cows</div>
                    <div class="stat-value">${this.cows.length}/${
      this.maxCows
    }</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Hay Bales</div>
                    <div class="stat-value">${this.hayBales}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Milk Bottles</div>
                    <div class="stat-value">${this.milkBottles}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Total Milk</div>
                    <div class="stat-value">${this.totalMilkProduced}</div>
                </div>
            </div>
            
            <div class="farm-management">
                <h3>🏪 Farm Store</h3>
                <div class="farm-actions">
                    <div class="farm-action">
                        <span>Buy Cow - $${this.cowCost}</span>
                        <button onclick="window.cowModule.buyCow()" 
                                ${
                                  moduleManager.currencyManager.getCurrency(
                                    "dollars"
                                  ) >= this.cowCost &&
                                  this.cows.length < this.maxCows
                                    ? ""
                                    : "disabled"
                                }>
                            ${
                              this.cows.length >= this.maxCows
                                ? "Max Cows"
                                : "Buy Cow"
                            }
                        </button>
                    </div>
                    <div class="farm-action">
                        <span>Buy 10 Hay Bales - $${this.hayBalesCost}</span>
                        <button onclick="window.cowModule.buyHay()" 
                                ${
                                  moduleManager.currencyManager.getCurrency(
                                    "dollars"
                                  ) >= this.hayBalesCost
                                    ? ""
                                    : "disabled"
                                }>
                            Buy Hay
                        </button>
                    </div>
                    <div class="farm-action">
                        <span>Feed All Idle Cows</span>
                        <button onclick="window.cowModule.feedAllCows()" 
                                ${this.canFeedCows() ? "" : "disabled"}>
                            Feed Cows (${this.getIdleCows().length} cows)
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="cow-pasture">
                <h3>🌾 Cow Pasture</h3>
                <div class="cows-grid">
                    ${this.renderCows()}
                </div>
            </div>
        `;
  }

  renderCows() {
    if (this.cows.length === 0) {
      return '<div class="empty-pasture">No cows yet! Buy your first cow to get started.</div>';
    }

    return this.cows
      .map((cow) => {
        const timeNow = Date.now();
        let cowDisplay = "";
        let cowClass = `cow cow-${cow.status}`;
        let cowAction = "";

        switch (cow.status) {
          case "idle":
            cowDisplay = "🐄";
            cowAction = `
                        <div class="cow-status">😴 Ready for hay</div>
                        <button class="feed-cow-btn" onclick="window.cowModule.feedCow(${
                          cow.id
                        })" 
                                ${this.hayBales > 0 ? "" : "disabled"}>
                            Feed Hay
                        </button>
                    `;
            break;

          case "eating":
            const eatTimeLeft = Math.max(
              0,
              cow.eatStartTime + this.cowEatingTime - timeNow
            );
            const eatProgress = Math.min(
              100,
              ((this.cowEatingTime - eatTimeLeft) / this.cowEatingTime) * 100
            );
            cowDisplay = "🐄";
            cowClass += " eating-animation";
            cowAction = `
                        <div class="cow-status">🌾 Eating... (${Math.ceil(
                          eatTimeLeft / 1000
                        )}s)</div>
                        <div class="eat-progress">
                            <div class="progress-bar" style="width: ${eatProgress}%"></div>
                        </div>
                    `;
            break;

          case "gassy":
            cowDisplay = "🐄💨";
            cowClass += " gassy-animation";
            cowAction = `
                        <div class="cow-status">💨 Gassy! Click to release! (${
                          cow.gasCount
                        }/${this.maxGasCount})</div>
                        <button class="gas-release-btn" onclick="window.cowModule.releaseGas(${
                          cow.id
                        })">
                            💨 Release Gas!
                        </button>
                        <div class="gas-counter">
                            ${"🟢".repeat(cow.gasCount)}${"⚪".repeat(
              this.maxGasCount - cow.gasCount
            )}
                        </div>
                    `;
            break;

          case "ready_to_milk":
            cowDisplay = "🐄🥛";
            cowClass += " ready-milk-animation";
            cowAction = `
                        <div class="cow-status">🥛 Ready to milk!</div>
                        <button class="milk-btn" 
                                onmousedown="window.cowModule.startMilking(${cow.id})"
                                onmouseup="window.cowModule.stopMilking(${cow.id})"
                                onmouseleave="window.cowModule.stopMilking(${cow.id})"
                                ontouchstart="window.cowModule.startMilking(${cow.id})"
                                ontouchend="window.cowModule.stopMilking(${cow.id})">
                            🥛 Hold to Milk
                        </button>
                    `;
            break;

          case "being_milked":
            const milkProgress = Math.max(
              0,
              ((this.maxMilkLevel - cow.milkLevel) / this.maxMilkLevel) * 100
            );
            cowDisplay = "🐄💧";
            cowClass += " milking-animation";
            cowAction = `
                        <div class="cow-status">💧 Being milked... Keep holding!</div>
                        <div class="milk-progress">
                            <div class="progress-bar" style="width: ${milkProgress}%"></div>
                        </div>
                        <div class="milk-level">Milk: ${
                          this.maxMilkLevel - cow.milkLevel
                        }/${this.maxMilkLevel}</div>
                    `;
            break;

          case "cooldown":
            const cooldownLeft = Math.max(0, cow.cooldownEndTime - timeNow);
            const cooldownProgress = Math.min(
              100,
              ((this.cowCooldownTime - cooldownLeft) / this.cowCooldownTime) *
                100
            );
            cowDisplay = "🐄😴";
            cowAction = `
                        <div class="cow-status">😴 Resting (${Math.ceil(
                          cooldownLeft / 1000
                        )}s)</div>
                        <div class="cooldown-progress">
                            <div class="progress-bar" style="width: ${cooldownProgress}%"></div>
                        </div>
                    `;
            break;
        }

        return `
                <div class="${cowClass}" data-cow-id="${cow.id}">
                    <div class="cow-visual">${cowDisplay}</div>
                    <div class="cow-info">
                        <div class="cow-name">Cow #${cow.id}</div>
                        ${cowAction}
                    </div>
                </div>
            `;
      })
      .join("");
  }

  // Buy a cow
  buyCow() {
    if (
      window.game.currencyManager.spend({ dollars: this.cowCost }) &&
      this.cows.length < this.maxCows
    ) {
      const newCow = {
        id: this.nextCowId++,
        status: "idle",
        gasCount: 0,
        milkLevel: this.maxMilkLevel,
        lastMilkTime: 0,
        eatStartTime: 0,
        cooldownEndTime: 0,
      };

      this.cows.push(newCow);
      window.showNotification(`🐄 Bought cow #${newCow.id}!`);
      window.game.render();
    }
  }

  // Buy hay
  buyHay() {
    if (window.game.currencyManager.spend({ dollars: this.hayBalesCost })) {
      this.hayBales += 10;
      window.showNotification("🌾 Bought 10 hay bales!");
      window.game.render();
    }
  }

  // Get idle cows
  getIdleCows() {
    return this.cows.filter((cow) => cow.status === "idle");
  }

  // Check if can feed cows
  canFeedCows() {
    return this.hayBales > 0 && this.getIdleCows().length > 0;
  }

  // Feed all idle cows
  feedAllCows() {
    const idleCows = this.getIdleCows();
    const cowsToFeed = Math.min(idleCows.length, this.hayBales);

    if (cowsToFeed > 0) {
      this.hayBales -= cowsToFeed;

      idleCows.slice(0, cowsToFeed).forEach((cow) => {
        this.feedCow(cow.id);
      });

      window.showNotification(`🌾 Fed ${cowsToFeed} cows!`);
    }
  }

  // Feed individual cow
  feedCow(cowId) {
    const cow = this.cows.find((c) => c.id === cowId);
    if (cow && cow.status === "idle" && this.hayBales > 0) {
      this.hayBales--;
      cow.status = "eating";
      cow.eatStartTime = Date.now();

      // After eating time, cow becomes gassy
      setTimeout(() => {
        if (cow.status === "eating") {
          cow.status = "gassy";
          cow.gasCount = 0;
          window.showNotification(`🐄💨 Cow #${cow.id} is getting gassy!`);
          window.game.render();
        }
      }, this.cowEatingTime);

      window.game.render();
    }
  }

  // Release gas from cow
  releaseGas(cowId) {
    const cow = this.cows.find((c) => c.id === cowId);
    if (cow && cow.status === "gassy") {
      cow.gasCount++;

      // Play fart sound effect (text notification)
      const fartSounds = ["💨 *POOT*", "💨 *FART*", "💨 *TOOT*", "💨 *BRAP*"];
      const randomFart =
        fartSounds[Math.floor(Math.random() * fartSounds.length)];
      window.showNotification(randomFart);

      if (cow.gasCount >= this.maxGasCount) {
        cow.status = "ready_to_milk";
        cow.milkLevel = this.maxMilkLevel;
        window.showNotification(`🥛 Cow #${cow.id} is ready to milk!`);
      }

      window.game.render();
    }
  }

  // Start milking cow
  startMilking(cowId) {
    const cow = this.cows.find((c) => c.id === cowId);
    if (cow && cow.status === "ready_to_milk") {
      cow.status = "being_milked";
      cow.milkingInterval = setInterval(() => {
        if (cow.milkLevel > 0) {
          cow.milkLevel -= 2; // Milk at 2 units per interval
          if (cow.milkLevel <= 0) {
            cow.milkLevel = 0;
            this.finishMilking(cow);
          }
          window.game.render();
        }
      }, 100); // Update every 100ms

      window.game.render();
    }
  }

  // Stop milking cow
  stopMilking(cowId) {
    const cow = this.cows.find((c) => c.id === cowId);
    if (cow && cow.status === "being_milked") {
      if (cow.milkingInterval) {
        clearInterval(cow.milkingInterval);
        cow.milkingInterval = null;
      }

      if (cow.milkLevel > 0) {
        // Stopped milking early, go back to ready state
        cow.status = "ready_to_milk";
      } else {
        // Finished milking
        this.finishMilking(cow);
      }

      window.game.render();
    }
  }

  // Finish milking cow
  finishMilking(cow) {
    if (cow.milkingInterval) {
      clearInterval(cow.milkingInterval);
      cow.milkingInterval = null;
    }

    const milkProduced = this.maxMilkLevel - cow.milkLevel;
    this.milkBottles += milkProduced;
    this.totalMilkProduced += milkProduced;

    cow.status = "cooldown";
    cow.cooldownEndTime = Date.now() + this.cowCooldownTime;
    cow.lastMilkTime = Date.now();

    // After cooldown, cow becomes idle again
    setTimeout(() => {
      if (cow.status === "cooldown") {
        cow.status = "idle";
        window.showNotification(`🐄 Cow #${cow.id} is ready for more hay!`);
        window.game.render();
      }
    }, this.cowCooldownTime);

    window.showNotification(`🥛 Got ${milkProduced} milk from cow #${cow.id}!`);
    window.game.render();
  }

  // Auto-sell milk
  startMilkSelling() {
    setInterval(() => {
      if (this.milkBottles > 0) {
        const milkToSell = Math.min(
          this.milkBottles,
          5 + Math.floor(Math.random() * 10)
        ); // Sell 5-14 bottles
        this.milkBottles -= milkToSell;

        const earnings = milkToSell * this.milkSellPrice;
        window.game.currencyManager.addCurrency("dollars", earnings);

        window.showNotification(
          `🥛 Sold ${milkToSell} milk bottles for $${earnings}!`
        );
        window.game.render();
      }
    }, 12000 + Math.random() * 8000); // Every 12-20 seconds
  }

  // Update cow states (called periodically)
  updateCowStates() {
    const now = Date.now();
    let needsUpdate = false;

    this.cows.forEach((cow) => {
      // Check if eating cow should become gassy
      if (
        cow.status === "eating" &&
        now >= cow.eatStartTime + this.cowEatingTime
      ) {
        cow.status = "gassy";
        cow.gasCount = 0;
        needsUpdate = true;
      }

      // Check if cow should come out of cooldown
      if (cow.status === "cooldown" && now >= cow.cooldownEndTime) {
        cow.status = "idle";
        needsUpdate = true;
      }
    });

    if (needsUpdate && window.game) {
      window.game.render();
    }
  }
}

// Start updating cow states periodically
setInterval(() => {
  if (window.cowModule) {
    window.cowModule.updateCowStates();
  }
}, 1000); // Check every second

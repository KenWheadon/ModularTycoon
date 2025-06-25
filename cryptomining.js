// Crypto Mining Module
class CryptoMiningModule extends GameModule {
  constructor() {
    super("crypto", "Crypto Mining", "💧", null);

    const config = GAME_CONFIG.CRYPTO_MINING;
    this.dripsPerTap = config.INITIAL_DRIPS_PER_TAP;
    this.activeTaps = config.INITIAL_TAPS;
    this.maxTaps = config.MAX_TAPS;
    this.cooldownTime = config.INITIAL_COOLDOWN;
    this.tapCooldowns = [false];

    this.upgradeCosts = {
      drip: config.UPGRADE_COSTS.DRIP_START,
      tap: config.UPGRADE_COSTS.TAP_START,
      cooldown: config.UPGRADE_COSTS.COOLDOWN_START,
    };
  }

  // Render module content
  renderContent(moduleManager) {
    return `
            <h2>${this.icon} ${this.name}</h2>
            <div class="module-stats">
                <div class="stat">
                    <div class="stat-label">Drips/Tap</div>
                    <div class="stat-value">${this.dripsPerTap}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Active Taps</div>
                    <div class="stat-value">${this.activeTaps}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Cooldown</div>
                    <div class="stat-value">${(
                      this.cooldownTime / 1000
                    ).toFixed(2)}s</div>
                </div>
            </div>
            
            <div class="action-area">
                <div class="tap-container" id="cryptoTaps">
                    ${this.renderTaps()}
                </div>
                
                <div class="converter">
                    <div>Convert DuckCoin to Dollars</div>
                    <div style="margin-top: 10px;">
                        <input type="number" id="convertAmount" min="1" value="${Math.ceil(
                          moduleManager.currencyManager.exchangeRates
                            .duckToDollar
                        )}" />
                        <button onclick="window.cryptoModule.convertCurrency()">Convert</button>
                    </div>
                    <div style="font-size: 0.8em; margin-top: 5px;">
                        Rate: ${moduleManager.currencyManager.exchangeRates.duckToDollar.toFixed(
                          1
                        )} DC = $1
                    </div>
                </div>
            </div>
            
            <div class="upgrades">
                <div class="upgrade">
                    <span>Increase Drips/Tap (+1) - ${
                      this.upgradeCosts.drip
                    } DC</span>
                    <button onclick="window.cryptoModule.buyUpgrade('drip')" 
                            ${
                              moduleManager.currencyManager.getCurrency(
                                "duckcoin"
                              ) >= this.upgradeCosts.drip
                                ? ""
                                : "disabled"
                            }>
                        Buy
                    </button>
                </div>
                <div class="upgrade">
                    <span>Add Tap (Max 5) - ${this.upgradeCosts.tap} DC</span>
                    <button onclick="window.cryptoModule.buyUpgrade('tap')" 
                            ${
                              moduleManager.currencyManager.getCurrency(
                                "duckcoin"
                              ) >= this.upgradeCosts.tap &&
                              this.activeTaps < this.maxTaps
                                ? ""
                                : "disabled"
                            }>
                        ${this.activeTaps >= this.maxTaps ? "Max Taps" : "Buy"}
                    </button>
                </div>
                <div class="upgrade">
                    <span>Reduce Cooldown (-0.01s) - ${
                      this.upgradeCosts.cooldown
                    } DC</span>
                    <button onclick="window.cryptoModule.buyUpgrade('cooldown')" 
                            ${
                              moduleManager.currencyManager.getCurrency(
                                "duckcoin"
                              ) >= this.upgradeCosts.cooldown &&
                              this.cooldownTime >
                                GAME_CONFIG.CRYPTO_MINING.MIN_COOLDOWN
                                ? ""
                                : "disabled"
                            }>
                        Buy
                    </button>
                </div>
            </div>
        `;
  }

  // Render taps
  renderTaps() {
    let html = "";
    for (let i = 0; i < this.activeTaps; i++) {
      const cooldownTime = this.tapCooldowns[i]
        ? Math.ceil((this.tapCooldowns[i] - Date.now()) / 1000)
        : 0;
      html += `
                <button class="tap" onclick="window.cryptoModule.clickTap(${i})" ${
        cooldownTime > 0 ? "disabled" : ""
      }>
                    💧
                    ${
                      cooldownTime > 0
                        ? `<div class="tap-cooldown">${cooldownTime}</div>`
                        : ""
                    }
                </button>
            `;
    }
    return html;
  }

  // Click tap
  clickTap(tapIndex) {
    if (this.tapCooldowns[tapIndex] && this.tapCooldowns[tapIndex] > Date.now())
      return;

    window.game.currencyManager.addCurrency("duckcoin", this.dripsPerTap);
    this.showDripAnimation(event.target, this.dripsPerTap);
    this.startTapCooldown(tapIndex);
    window.game.render();
  }

  // Start tap cooldown
  startTapCooldown(tapIndex) {
    this.tapCooldowns[tapIndex] = Date.now() + this.cooldownTime;

    const updateCooldown = () => {
      const timeLeft = this.tapCooldowns[tapIndex] - Date.now();
      if (timeLeft <= 0) {
        this.tapCooldowns[tapIndex] = false;
        window.game.render();
      } else {
        window.game.render();
        setTimeout(
          updateCooldown,
          GAME_CONFIG.UI.RENDER_INTERVALS.COOLDOWN_UPDATE
        );
      }
    };

    setTimeout(updateCooldown, GAME_CONFIG.UI.RENDER_INTERVALS.COOLDOWN_UPDATE);
  }

  // Buy upgrade
  buyUpgrade(type) {
    const cost = this.upgradeCosts[type];
    const currencyManager = window.game.currencyManager;

    if (currencyManager.spend({ duckcoin: cost })) {
      const config = GAME_CONFIG.CRYPTO_MINING;

      switch (type) {
        case "drip":
          this.dripsPerTap++;
          this.upgradeCosts.drip = Math.ceil(
            this.upgradeCosts.drip * config.UPGRADE_COSTS.DRIP_MULTIPLIER
          );
          break;
        case "tap":
          if (this.activeTaps < this.maxTaps) {
            this.activeTaps++;
            this.tapCooldowns.push(false);
            this.upgradeCosts.tap = Math.ceil(
              this.upgradeCosts.tap * config.UPGRADE_COSTS.TAP_MULTIPLIER
            );
          }
          break;
        case "cooldown":
          if (this.cooldownTime > config.MIN_COOLDOWN) {
            this.cooldownTime -= config.COOLDOWN_REDUCTION;
            this.upgradeCosts.cooldown = Math.ceil(
              this.upgradeCosts.cooldown *
                config.UPGRADE_COSTS.COOLDOWN_MULTIPLIER
            );
          }
          break;
      }

      window.showNotification("Crypto upgrade purchased!");
      window.game.render();
    }
  }

  // Convert currency
  convertCurrency() {
    const input = document.getElementById("convertAmount");
    const amount = parseInt(input.value) || 0;
    if (amount > 0) {
      const result = window.game.currencyManager.convertCurrency(
        "duckcoin",
        "dollars",
        amount
      );
      if (result.success) {
        window.showNotification(
          `Converted ${amount} DC to $${result.received}`
        );
        window.game.render();
      }
    }
  }

  // Show drip animation
  showDripAnimation(target, amount) {
    const rect = target.getBoundingClientRect();
    const animation = document.createElement("div");
    animation.className = "drip-animation";
    animation.textContent = `+${amount} 💧`;
    animation.style.left = rect.left + rect.width / 2 + "px";
    animation.style.top = rect.top + "px";

    document.body.appendChild(animation);

    setTimeout(() => {
      if (document.body.contains(animation)) {
        document.body.removeChild(animation);
      }
    }, GAME_CONFIG.UI.ANIMATION_DURATION);
  }
}

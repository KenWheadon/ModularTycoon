// Currency Manager Class
class CurrencyManager {
  constructor() {
    this.currencies = {
      [GAME_CONFIG.CURRENCIES.DUCKCOIN]: 0,
      [GAME_CONFIG.CURRENCIES.DOLLARS]: 0,
    };

    this.exchangeRates = {
      duckToDollar: GAME_CONFIG.EXCHANGE_RATES.DUCK_TO_DOLLAR_START,
    };

    this.startExchangeRateFluctuation();
  }

  // Add currency
  addCurrency(type, amount) {
    if (this.currencies.hasOwnProperty(type)) {
      this.currencies[type] += amount;
      return true;
    }
    return false;
  }

  // Get currency amount
  getCurrency(type) {
    return this.currencies[type] || 0;
  }

  // Check if can afford costs
  canAfford(costs) {
    for (let [currency, amount] of Object.entries(costs)) {
      if (this.currencies[currency] < amount) {
        return false;
      }
    }
    return true;
  }

  // Spend currencies
  spend(costs) {
    if (this.canAfford(costs)) {
      for (let [currency, amount] of Object.entries(costs)) {
        this.currencies[currency] -= amount;
      }
      return true;
    }
    return false;
  }

  // Convert currency
  convertCurrency(from, to, amount) {
    const rate = this.exchangeRates.duckToDollar;
    if (
      from === GAME_CONFIG.CURRENCIES.DUCKCOIN &&
      to === GAME_CONFIG.CURRENCIES.DOLLARS
    ) {
      const dollarsReceived = Math.floor(amount / rate);
      if (
        this.currencies[GAME_CONFIG.CURRENCIES.DUCKCOIN] >= amount &&
        dollarsReceived > 0
      ) {
        this.currencies[GAME_CONFIG.CURRENCIES.DUCKCOIN] -= amount;
        this.currencies[GAME_CONFIG.CURRENCIES.DOLLARS] += dollarsReceived;
        return { success: true, received: dollarsReceived };
      }
    }
    return { success: false, received: 0 };
  }

  // Start exchange rate fluctuation
  startExchangeRateFluctuation() {
    setInterval(() => {
      const config = GAME_CONFIG.EXCHANGE_RATES;
      const variation = (Math.random() - 0.5) * config.FLUCTUATION_AMOUNT;
      this.exchangeRates.duckToDollar = Math.max(
        config.DUCK_TO_DOLLAR_MIN,
        Math.min(
          config.DUCK_TO_DOLLAR_MAX,
          this.exchangeRates.duckToDollar * (1 + variation)
        )
      );
    }, GAME_CONFIG.EXCHANGE_RATES.FLUCTUATION_INTERVAL);
  }

  // Render currency display
  renderCurrencyDisplay() {
    const container = document.getElementById("currencyDisplay");
    if (!container) return;

    container.innerHTML = "";

    // Main currencies
    container.appendChild(
      this.createCurrencyDisplay("DuckCoin", this.currencies.duckcoin, "💧")
    );
    container.appendChild(
      this.createCurrencyDisplay("Dollars", this.currencies.dollars, "💵")
    );

    // Exchange rate
    const rateDisplay = document.createElement("div");
    rateDisplay.className = "currency exchange-rate";
    rateDisplay.innerHTML = `
            <div class="currency-name">Exchange Rate</div>
            <div class="currency-value">${this.exchangeRates.duckToDollar.toFixed(
              1
            )} DC = $1</div>
        `;
    container.appendChild(rateDisplay);
  }

  // Create currency display element
  createCurrencyDisplay(name, value, icon) {
    const div = document.createElement("div");
    div.className = "currency";
    div.innerHTML = `
            <div class="currency-name">${icon} ${name}</div>
            <div class="currency-value">${Math.floor(value)}</div>
        `;
    return div;
  }
}

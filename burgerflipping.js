// Burger Flipping Module
class BurgerFlippingModule extends GameModule {
    constructor() {
        super('burger', 'Burger Flipper', '🍔', {
            cost: GAME_CONFIG.MODULE_UNLOCKS.BURGER,
            description: 'Unlock burger restaurant for $200'
        });
        
        // Inventory
        this.inventory = {
            meat: 0,
            buns: 0,
            tomatoes: 0,
            cheese: 0
        };
        
        // Game state
        this.reputation = 0;
        this.completedBurgers = 0;
        this.activePatties = []; // {id, startTime, cookTime, perfectTime, status: 'shaping'|'cooking'|'ready'|'burned'}
        this.rawMeatQueue = []; // {id, shapeProgress, targetShape, isShaping}
        this.finishedBurgers = 0;
        
        // Game settings
        this.pattyCookTimeMin = 27000; // 27 seconds
        this.pattyCookTimeMax = 33000; // 33 seconds
        this.pattyPerfectTime = 30000; // 30 seconds for perfect cook
        this.shapingTimeWindow = 3000; // 3 second window to click
        this.burgerSellPrice = 15;
        this.nextPattyId = 1;
        
        // Ingredient costs
        this.ingredientCosts = {
            meat: 2,
            buns: 1,
            tomatoes: 1,
            cheese: 2
        };
        
        this.startBurgerSelling();
    }

    renderContent(moduleManager) {
        return `
            <h2>${this.icon} ${this.name}</h2>
            <div class="module-stats">
                <div class="stat">
                    <div class="stat-label">Burgers Sold</div>
                    <div class="stat-value">${this.completedBurgers}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Reputation</div>
                    <div class="stat-value">${this.reputation}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Ready Burgers</div>
                    <div class="stat-value">${this.finishedBurgers}</div>
                </div>
            </div>
            
            <div class="burger-inventory">
                <h3>📦 Inventory</h3>
                <div class="inventory-grid">
                    <div class="inventory-item">
                        <span>🥩 Meat: ${this.inventory.meat}</span>
                        <button onclick="window.burgerModule.buyIngredient('meat', 5)" 
                                ${moduleManager.currencyManager.getCurrency('dollars') >= (this.ingredientCosts.meat * 5) ? '' : 'disabled'}>
                            Buy 5 ($${this.ingredientCosts.meat * 5})
                        </button>
                    </div>
                    <div class="inventory-item">
                        <span>🍞 Buns: ${this.inventory.buns}</span>
                        <button onclick="window.burgerModule.buyIngredient('buns', 5)" 
                                ${moduleManager.currencyManager.getCurrency('dollars') >= (this.ingredientCosts.buns * 5) ? '' : 'disabled'}>
                            Buy 5 ($${this.ingredientCosts.buns * 5})
                        </button>
                    </div>
                    <div class="inventory-item">
                        <span>🍅 Tomatoes: ${this.inventory.tomatoes}</span>
                        <button onclick="window.burgerModule.buyIngredient('tomatoes', 5)" 
                                ${moduleManager.currencyManager.getCurrency('dollars') >= (this.ingredientCosts.tomatoes * 5) ? '' : 'disabled'}>
                            Buy 5 ($${this.ingredientCosts.tomatoes * 5})
                        </button>
                    </div>
                    <div class="inventory-item">
                        <span>🧀 Cheese: ${this.inventory.cheese}</span>
                        <button onclick="window.burgerModule.buyIngredient('cheese', 5)" 
                                ${moduleManager.currencyManager.getCurrency('dollars') >= (this.ingredientCosts.cheese * 5) ? '' : 'disabled'}>
                            Buy 5 ($${this.ingredientCosts.cheese * 5})
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="burger-kitchen">
                <h3>👨‍🍳 Kitchen</h3>
                
                <div class="prep-station">
                    <h4>Prep Station</h4>
                    <button class="start-shaping-btn" onclick="window.burgerModule.startShaping()" 
                            ${this.inventory.meat > 0 && this.rawMeatQueue.length < 3 ? '' : 'disabled'}>
                        Start Shaping Patty (🥩)
                    </button>
                    <div class="raw-meat-queue">
                        ${this.renderRawMeatQueue()}
                    </div>
                </div>
                
                <div class="grill-station">
                    <h4>🔥 Grill</h4>
                    <button class="add-to-grill-btn" onclick="window.burgerModule.addToGrill()" 
                            ${this.getShapedPatties().length > 0 && this.activePatties.length < 4 ? '' : 'disabled'}>
                        Add Patty to Grill
                    </button>
                    <div class="grill-area">
                        ${this.renderGrill()}
                    </div>
                </div>
                
                <div class="assembly-station">
                    <h4>🍔 Assembly</h4>
                    <button class="make-burger-btn" onclick="window.burgerModule.assembleBurger()" 
                            ${this.canMakeBurger() ? '' : 'disabled'}>
                        Make Burger (Need: 🍞🥩🍅🧀)
                    </button>
                    <div class="burger-status">
                        Ready patties: ${this.getReadyPatties().length} | 
                        Can make: ${this.getMaxBurgers()} burgers
                    </div>
                </div>
            </div>
        `;
    }

    renderRawMeatQueue() {
        if (this.rawMeatQueue.length === 0) {
            return '<div class="empty-queue">No meat being shaped</div>';
        }
        
        return this.rawMeatQueue.map(meat => {
            if (meat.isShaping) {
                return `
                    <div class="shaping-meat active" onclick="window.burgerModule.clickShape(${meat.id})">
                        <div class="meat-progress">
                            <div class="progress-bar" style="width: ${(meat.shapeProgress / meat.targetShape) * 100}%"></div>
                        </div>
                        <div class="shape-instruction">Click to shape! (${meat.shapeProgress}/${meat.targetShape})</div>
                    </div>
                `;
            } else {
                return `
                    <div class="shaped-meat ready">
                        ✅ Patty shaped and ready!
                    </div>
                `;
            }
        }).join('');
    }

    renderGrill() {
        if (this.activePatties.length === 0) {
            return '<div class="empty-grill">Grill is empty</div>';
        }
        
        return this.activePatties.map(patty => {
            const timeElapsed = Date.now() - patty.startTime;
            const timeRemaining = Math.max(0, this.pattyCookTimeMax - timeElapsed);
            const cookProgress = Math.min(100, (timeElapsed / this.pattyPerfectTime) * 100);
            
            let status = '';
            let className = 'cooking-patty ';
            
            if (patty.status === 'burned') {
                status = '🔥 BURNED!';
                className += 'burned';
            } else if (patty.status === 'ready') {
                status = '✅ Perfect!';
                className += 'perfect';
            } else if (timeElapsed >= this.pattyCookTimeMin) {
                status = `⏰ Ready! (${Math.ceil(timeRemaining/1000)}s left)`;
                className += 'ready-to-flip';
            } else {
                status = `🍳 Cooking... (${Math.ceil((this.pattyCookTimeMin - timeElapsed)/1000)}s)`;
                className += 'cooking';
            }
            
            return `
                <div class="${className}" onclick="window.burgerModule.flipPatty(${patty.id})">
                    <div class="patty-visual">🥩</div>
                    <div class="cook-progress">
                        <div class="progress-bar" style="width: ${cookProgress}%"></div>
                    </div>
                    <div class="patty-status">${status}</div>
                </div>
            `;
        }).join('');
    }

    // Buy ingredients
    buyIngredient(type, amount) {
        const cost = this.ingredientCosts[type] * amount;
        if (window.game.currencyManager.spend({dollars: cost})) {
            this.inventory[type] += amount;
            window.showNotification(`Bought ${amount} ${type} for $${cost}`);
            window.game.render();
        }
    }

    // Start shaping a patty
    startShaping() {
        if (this.inventory.meat > 0 && this.rawMeatQueue.length < 3) {
            this.inventory.meat--;
            const targetClicks = 3 + Math.floor(Math.random() * 3); // 3-5 clicks needed
            
            const meatData = {
                id: this.nextPattyId++,
                shapeProgress: 0,
                targetShape: targetClicks,
                isShaping: true,
                startTime: Date.now()
            };
            
            this.rawMeatQueue.push(meatData);
            
            // Auto-fail shaping if not completed in time
            setTimeout(() => {
                const meat = this.rawMeatQueue.find(m => m.id === meatData.id);
                if (meat && meat.isShaping) {
                    this.rawMeatQueue = this.rawMeatQueue.filter(m => m.id !== meatData.id);
                    window.showNotification('❌ Meat ruined - took too long to shape!');
                    window.game.render();
                }
            }, this.shapingTimeWindow);
            
            window.game.render();
        }
    }

    // Click to shape meat
    clickShape(meatId) {
        const meat = this.rawMeatQueue.find(m => m.id === meatId && m.isShaping);
        if (meat) {
            meat.shapeProgress++;
            
            if (meat.shapeProgress >= meat.targetShape) {
                meat.isShaping = false;
                window.showNotification('✅ Patty shaped perfectly!');
            }
            
            window.game.render();
        }
    }

    // Get shaped patties ready for grill
    getShapedPatties() {
        return this.rawMeatQueue.filter(m => !m.isShaping);
    }

    // Add patty to grill
    addToGrill() {
        const shapedPatties = this.getShapedPatties();
        if (shapedPatties.length > 0 && this.activePatties.length < 4) {
            const patty = shapedPatties[0];
            this.rawMeatQueue = this.rawMeatQueue.filter(m => m.id !== patty.id);
            
            const grillPatty = {
                id: patty.id,
                startTime: Date.now(),
                status: 'cooking'
            };
            
            this.activePatties.push(grillPatty);
            
            // Auto-burn patty if left too long
            setTimeout(() => {
                const activePatty = this.activePatties.find(p => p.id === grillPatty.id);
                if (activePatty && activePatty.status === 'cooking') {
                    activePatty.status = 'burned';
                    window.showNotification('🔥 Patty burned!');
                    window.game.render();
                }
            }, this.pattyCookTimeMax + 1000);
            
            window.game.render();
        }
    }

    // Flip/remove patty from grill
    flipPatty(pattyId) {
        const patty = this.activePatties.find(p => p.id === pattyId);
        if (patty && patty.status === 'cooking') {
            const timeElapsed = Date.now() - patty.startTime;
            
            if (timeElapsed >= this.pattyCookTimeMin && timeElapsed <= this.pattyCookTimeMax) {
                patty.status = 'ready';
                window.showNotification('🎉 Perfect cook!');
                this.reputation += 1;
            } else if (timeElapsed < this.pattyCookTimeMin) {
                // Too early - patty is undercooked
                this.activePatties = this.activePatties.filter(p => p.id !== pattyId);
                window.showNotification('❌ Undercooked! Patty wasted.');
            } else {
                patty.status = 'burned';
                window.showNotification('🔥 Overcooked!');
            }
            
            window.game.render();
        } else if (patty && patty.status === 'burned') {
            // Remove burned patty
            this.activePatties = this.activePatties.filter(p => p.id !== pattyId);
            window.showNotification('🗑️ Threw away burned patty');
            window.game.render();
        }
    }

    // Get ready patties
    getReadyPatties() {
        return this.activePatties.filter(p => p.status === 'ready');
    }

    // Check if can make burger
    canMakeBurger() {
        return this.getReadyPatties().length > 0 && 
               this.inventory.buns > 0 && 
               this.inventory.tomatoes > 0 && 
               this.inventory.cheese > 0;
    }

    // Get max burgers that can be made
    getMaxBurgers() {
        const readyPatties = this.getReadyPatties().length;
        return Math.min(
            readyPatties,
            this.inventory.buns,
            this.inventory.tomatoes,
            this.inventory.cheese
        );
    }

    // Assemble burger
    assembleBurger() {
        if (this.canMakeBurger()) {
            // Use ingredients
            const readyPatty = this.getReadyPatties()[0];
            this.activePatties = this.activePatties.filter(p => p.id !== readyPatty.id);
            this.inventory.buns--;
            this.inventory.tomatoes--;
            this.inventory.cheese--;
            
            this.finishedBurgers++;
            window.showNotification('🍔 Burger assembled!');
            window.game.render();
        }
    }

    // Auto-sell burgers
    startBurgerSelling() {
        setInterval(() => {
            if (this.finishedBurgers > 0) {
                const burgersToSell = Math.min(this.finishedBurgers, 1 + Math.floor(Math.random() * 2)); // Sell 1-2 burgers
                this.finishedBurgers -= burgersToSell;
                this.completedBurgers += burgersToSell;
                
                const earnings = burgersToSell * this.burgerSellPrice;
                window.game.currencyManager.addCurrency('dollars', earnings);
                
                window.showNotification(`💰 Sold ${burgersToSell} burger(s) for $${earnings}!`);
                window.game.render();
            }
        }, 8000 + Math.random() * 7000); // Every 8-15 seconds
    }
}
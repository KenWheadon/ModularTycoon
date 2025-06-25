// NFT Cards Module
class NFTCardsModule extends GameModule {
    constructor() {
        super('nft', 'NFT Cards', '🃏', {
            cost: GAME_CONFIG.MODULE_UNLOCKS.NFT,
            description: 'Unlock NFT card trading for 500 DuckCoin'
        });
        
        // Game state
        this.cardPacks = 0;
        this.cardCollection = []; // {id, name, rarity, emoji, baseValue, marketValue}
        this.marketplace = []; // {cardId, hasOffer, offer, offerTime, listingPrice}
        this.totalCardsOpened = 0;
        this.totalSales = 0;
        this.reputation = 0;
        
        // Settings
        this.packCost = 50; // DuckCoin
        this.cardsPerPack = 5;
        this.maxMarketplaceSlots = 8;
        this.nextCardId = 1;
        
        // Card rarities and their chances
        this.cardRarities = {
            common: { 
                chance: 0.60, 
                valueMultiplier: 1, 
                emoji: '⚪', 
                color: '#808080',
                names: ['Doge Walker', 'Basic Ape', 'Pixel Cat', 'Simple Duck', 'Plain Rock', 'Basic Tree']
            },
            uncommon: { 
                chance: 0.25, 
                valueMultiplier: 2, 
                emoji: '🟢', 
                color: '#32cd32',
                names: ['Cool Cat', 'Rare Pepe', 'Golden Duck', 'Mystic Ape', 'Crystal Rock', 'Magic Tree']
            },
            rare: { 
                chance: 0.10, 
                valueMultiplier: 5, 
                emoji: '🔵', 
                color: '#4169e1',
                names: ['Diamond Hands', 'Laser Eyes', 'Rainbow Duck', 'Cyber Ape', 'Meteor Rock', 'Ancient Tree']
            },
            epic: { 
                chance: 0.04, 
                valueMultiplier: 12, 
                emoji: '🟣', 
                color: '#9932cc',
                names: ['Moon Walker', 'Galaxy Brain', 'Phoenix Duck', 'Cosmic Ape', 'Star Rock', 'World Tree']
            },
            legendary: { 
                chance: 0.01, 
                valueMultiplier: 50, 
                emoji: '🟡', 
                color: '#ffd700',
                names: ['Ultra Rare Chad', 'Gigachad Ape', 'Divine Duck', 'Alpha Ape', 'Infinity Stone', 'Tree of Life']
            }
        };
        
        this.startOfferSystem();
    }

    renderContent(moduleManager) {
        return `
            <h2>${this.icon} ${this.name}</h2>
            <div class="module-stats">
                <div class="stat">
                    <div class="stat-label">Card Packs</div>
                    <div class="stat-value">${this.cardPacks}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Cards Owned</div>
                    <div class="stat-value">${this.cardCollection.length}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Total Sales</div>
                    <div class="stat-value">${this.totalSales}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Reputation</div>
                    <div class="stat-value">${this.reputation}</div>
                </div>
            </div>
            
            <div class="nft-shop">
                <h3>🛒 NFT Shop</h3>
                <div class="shop-actions">
                    <div class="shop-action">
                        <span>Buy Card Pack (${this.cardsPerPack} cards) - ${this.packCost} DC</span>
                        <button onclick="window.nftModule.buyPack()" 
                                ${moduleManager.currencyManager.getCurrency('duckcoin') >= this.packCost ? '' : 'disabled'}>
                            Buy Pack
                        </button>
                    </div>
                    <div class="shop-action">
                        <span>Open Pack (Rip it!)</span>
                        <button class="open-pack-btn" onclick="window.nftModule.openPack()" 
                                ${this.cardPacks > 0 ? '' : 'disabled'}>
                            🎉 Open Pack!
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="card-collection">
                <h3>📚 Your Collection</h3>
                <div class="collection-filter">
                    <button onclick="window.nftModule.filterCollection('all')" class="filter-btn active">All (${this.cardCollection.length})</button>
                    <button onclick="window.nftModule.filterCollection('common')" class="filter-btn">Common</button>
                    <button onclick="window.nftModule.filterCollection('uncommon')" class="filter-btn">Uncommon</button>
                    <button onclick="window.nftModule.filterCollection('rare')" class="filter-btn">Rare</button>
                    <button onclick="window.nftModule.filterCollection('epic')" class="filter-btn">Epic</button>
                    <button onclick="window.nftModule.filterCollection('legendary')" class="filter-btn">Legendary</button>
                </div>
                <div class="cards-grid" id="cardsGrid">
                    ${this.renderCardCollection()}
                </div>
            </div>
            
            <div class="nft-marketplace">
                <h3>🏪 Marketplace</h3>
                <div class="marketplace-info">
                    <p>Listed: ${this.marketplace.length}/${this.maxMarketplaceSlots} slots</p>
                </div>
                <div class="marketplace-grid">
                    ${this.renderMarketplace()}
                </div>
            </div>
        `;
    }

    // Buy card pack
    buyPack() {
        if (window.game.currencyManager.spend({duckcoin: this.packCost})) {
            this.cardPacks++;
            window.showNotification(`📦 Bought NFT card pack!`);
            window.game.render();
        }
    }

    // Open card pack
    openPack() {
        if (this.cardPacks > 0) {
            this.cardPacks--;
            const newCards = [];
            
            // Generate cards for this pack
            for (let i = 0; i < this.cardsPerPack; i++) {
                const card = this.generateRandomCard();
                this.cardCollection.push(card);
                newCards.push(card);
                this.totalCardsOpened++;
            }
            
            // Show pack opening animation/notification
            this.showPackOpening(newCards);
            window.game.render();
        }
    }

    // Generate random card
    generateRandomCard() {
        const rand = Math.random();
        let cumulativeChance = 0;
        let selectedRarity = 'common';
        
        // Determine rarity based on chances
        for (const [rarity, data] of Object.entries(this.cardRarities)) {
            cumulativeChance += data.chance;
            if (rand <= cumulativeChance) {
                selectedRarity = rarity;
                break;
            }
        }
        
        const rarityData = this.cardRarities[selectedRarity];
        const randomName = rarityData.names[Math.floor(Math.random() * rarityData.names.length)];
        const baseValue = Math.floor((Math.random() * 20 + 10) * rarityData.valueMultiplier);
        
        return {
            id: this.nextCardId++,
            name: randomName,
            rarity: selectedRarity,
            emoji: rarityData.emoji,
            color: rarityData.color,
            baseValue: baseValue,
            marketValue: baseValue + Math.floor(Math.random() * baseValue * 0.5 - baseValue * 0.25) // ±25% variance
        };
    }

    // Show pack opening results
    showPackOpening(cards) {
        const rarityNames = {
            common: 'Common',
            uncommon: 'Uncommon', 
            rare: 'Rare',
            epic: 'Epic',
            legendary: 'LEGENDARY!'
        };
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                const message = `${card.emoji} ${rarityNames[card.rarity]}: ${card.name}!`;
                window.showNotification(message);
            }, index * 500);
        });
        
        // Special notification for legendary cards
        const legendaryCards = cards.filter(c => c.rarity === 'legendary');
        if (legendaryCards.length > 0) {
            setTimeout(() => {
                window.showNotification(`🎉 LEGENDARY PULL! You got ${legendaryCards.length} legendary card(s)!`);
            }, cards.length * 500 + 1000);
        }
    }

    // Render card collection
    renderCardCollection() {
        if (this.cardCollection.length === 0) {
            return '<div class="empty-collection">No cards yet! Buy and open packs to start collecting.</div>';
        }
        
        const availableCards = this.cardCollection.filter(card => 
            !this.marketplace.some(listing => listing.cardId === card.id)
        );
        
        if (availableCards.length === 0) {
            return '<div class="empty-collection">All cards are listed in marketplace!</div>';
        }
        
        return availableCards.map(card => {
            return `
                <div class="nft-card ${card.rarity}" data-rarity="${card.rarity}">
                    <div class="card-header" style="background: ${card.color}">
                        <span class="card-rarity">${card.emoji} ${card.rarity.toUpperCase()}</span>
                    </div>
                    <div class="card-content">
                        <div class="card-name">${card.name}</div>
                        <div class="card-id">#${card.id}</div>
                        <div class="card-value">💰 $${card.marketValue}</div>
                    </div>
                    <div class="card-actions">
                        <button class="list-card-btn" onclick="window.nftModule.listCard(${card.id})"
                                ${this.marketplace.length < this.maxMarketplaceSlots ? '' : 'disabled'}>
                            📋 List for Sale
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Filter collection
    filterCollection(rarity) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Filter cards
        const cards = document.querySelectorAll('.nft-card');
        cards.forEach(card => {
            if (rarity === 'all' || card.dataset.rarity === rarity) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // List card in marketplace
    listCard(cardId) {
        const card = this.cardCollection.find(c => c.id === cardId);
        if (card && this.marketplace.length < this.maxMarketplaceSlots) {
            this.marketplace.push({
                cardId: cardId,
                hasOffer: false,
                offer: 0,
                offerTime: 0,
                listingPrice: card.marketValue
            });
            
            window.showNotification(`📋 Listed "${card.name}" for sale!`);
            window.game.render();
        }
    }

    // Render marketplace
    renderMarketplace() {
        if (this.marketplace.length === 0) {
            return '<div class="empty-marketplace">No cards listed. List some cards from your collection!</div>';
        }
        
        return this.marketplace.map((listing, index) => {
            const card = this.cardCollection.find(c => c.id === listing.cardId);
            if (!card) return '';
            
            const profitColor = listing.offer > listing.listingPrice ? '#00ff9f' : 
                              listing.offer < listing.listingPrice ? '#ff6b6b' : '#ffd93d';
            const profitText = listing.offer > listing.listingPrice ? 'PROFIT' :
                             listing.offer < listing.listingPrice ? 'LOSS' : 'BREAK EVEN';
            
            return `
                <div class="marketplace-slot">
                    <div class="listed-card">
                        <div class="card-preview" style="border-color: ${card.color}">
                            <div class="card-rarity-small">${card.emoji}</div>
                            <div class="card-name-small">${card.name}</div>
                            <div class="card-listing-price">Listed: $${listing.listingPrice}</div>
                        </div>
                        
                        ${listing.hasOffer ? `
                            <div class="offer-section">
                                <div class="offer-amount" style="color: ${profitColor};">
                                    Offer: $${listing.offer}
                                </div>
                                <div class="offer-status" style="color: ${profitColor};">
                                    ${profitText}
                                </div>
                                <div class="offer-buttons">
                                    <button class="accept-btn" onclick="window.nftModule.acceptOffer(${index})">
                                        Accept
                                    </button>
                                    <button class="reject-btn" onclick="window.nftModule.rejectOffer(${index})">
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <div class="waiting-offer">
                                <div class="waiting-text">⏳ Waiting for offer...</div>
                                <button class="remove-listing-btn" onclick="window.nftModule.removeListing(${index})">
                                    ❌ Remove
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Start offer generation system
    startOfferSystem() {
        const generateOffers = () => {
            const interval = Math.random() * 15000 + 10000; // 10-25 seconds
            
            setTimeout(() => {
                this.generateOffers();
                generateOffers();
            }, interval);
        };
        
        generateOffers();
    }

    // Generate offers for listed cards
    generateOffers() {
        this.marketplace.forEach(listing => {
            if (!listing.hasOffer && Math.random() > 0.4) { // 60% chance
                const card = this.cardCollection.find(c => c.id === listing.cardId);
                if (card) {
                    // Offer based on rarity and market conditions
                    const rarityMultiplier = {
                        common: 0.7,
                        uncommon: 0.8,
                        rare: 0.9,
                        epic: 1.1,
                        legendary: 1.3
                    };
                    
                    const baseMultiplier = rarityMultiplier[card.rarity] || 0.8;
                    const randomMultiplier = Math.random() * 1.8 + 0.4; // 0.4x to 2.2x
                    const finalMultiplier = baseMultiplier * randomMultiplier;
                    
                    listing.offer = Math.floor(listing.listingPrice * finalMultiplier);
                    listing.hasOffer = true;
                    listing.offerTime = Date.now();
                    
                    if (window.game) {
                        window.game.render();
                    }
                }
            }
        });
    }

    // Accept offer
    acceptOffer(listingIndex) {
        const listing = this.marketplace[listingIndex];
        if (listing && listing.hasOffer) {
            const card = this.cardCollection.find(c => c.id === listing.cardId);
            
            // Add money to dollars (NFTs sell for dollars)
            window.game.currencyManager.addCurrency('dollars', listing.offer);
            
            // Remove card from collection
            this.cardCollection = this.cardCollection.filter(c => c.id !== listing.cardId);
            
            // Remove from marketplace
            this.marketplace.splice(listingIndex, 1);
            
            this.totalSales++;
            this.reputation += Math.floor(listing.offer / 50); // Rep based on sale value
            
            const profit = listing.offer - listing.listingPrice;
            const profitText = profit > 0 ? `+$${profit} profit!` : 
                             profit < 0 ? `$${Math.abs(profit)} loss` : 'broke even';
            
            window.showNotification(`💰 Sold "${card.name}" for $${listing.offer}! ${profitText}`);
            window.game.render();
        }
    }

    // Reject offer
    rejectOffer(listingIndex) {
        const listing = this.marketplace[listingIndex];
        if (listing) {
            listing.hasOffer = false;
            listing.offer = 0;
            window.game.render();
        }
    }

    // Remove listing
    removeListing(listingIndex) {
        const listing = this.marketplace[listingIndex];
        if (listing) {
            const card = this.cardCollection.find(c => c.id === listing.cardId);
            this.marketplace.splice(listingIndex, 1);
            window.showNotification(`📋 Removed "${card.name}" from marketplace`);
            window.game.render();
        }
    }
}
class PersonalizedInsightsService {
  constructor() {
    // Default spending limits as percentages of total balance
    this.defaultLimits = {
      'Food': 25,      // 25% of total balance
      'Shopping': 15,  // 15% of total balance
      'Travel': 10,    // 10% of total balance
      'Bills': 20,     // 20% of total balance
      'Entertainment': 8, // 8% of total balance
      'Health': 5,     // 5% of total balance
      'Education': 10, // 10% of total balance
      'Other': 10      // 10% of total balance
    };

    // Emojis for different categories
    this.categoryEmojis = {
      'Food': '🍔',
      'Shopping': '🛒',
      'Travel': '🚌',
      'Bills': '💡',
      'Entertainment': '🎭',
      'Health': '🏥',
      'Education': '📚',
      'Income': '💰',
      'Other': '💳'
    };
  }

  /**
   * Categorize transaction based on description keywords
   */
  categorizeTransaction(transaction) {
    // If a category was explicitly chosen during payment, always respect it
    if (transaction && typeof transaction.category === 'string') {
      const chosen = transaction.category.trim();
      if (chosen && chosen !== 'Other') {
        return chosen;
      }
    }
    const description = (transaction.description || '').toLowerCase();
    const amount = transaction.amount || 0;

    // Income detection
    if (transaction.direction === 'received' || 
        this.hasKeywords(description, ['salary', 'income', 'credit', 'deposit', 'bonus', 'refund'])) {
      return 'Income';
    }

    // Food & Dining
    if (this.hasKeywords(description, ['restaurant', 'food', 'dining', 'swiggy', 'zomato', 'uber eats', 'pizza', 'cafe', 'coffee', 'delivery', 'kitchen', 'dine'])) {
      return 'Food';
    }

    // Shopping
    if (this.hasKeywords(description, ['amazon', 'flipkart', 'myntra', 'store', 'shopping', 'mart', 'buy', 'purchase', 'mall', 'outlet'])) {
      return 'Shopping';
    }

    // Travel & Transport (including fuel/petrol)
    if (this.hasKeywords(description, ['uber', 'ola', 'taxi', 'flight', 'train', 'bus', 'travel', 'transport', 'metro', 'auto', 'cab', 'petrol', 'diesel', 'fuel', 'gas'])) {
      return 'Travel';
    }

    // Bills & Utilities
    if (this.hasKeywords(description, ['bill', 'electric', 'water', 'internet', 'mobile', 'postpaid', 'rent', 'emi', 'utility', 'broadband'])) {
      return 'Bills';
    }

    // Entertainment
    if (this.hasKeywords(description, ['netflix', 'spotify', 'hotstar', 'zee', 'movie', 'ticket', 'entertainment', 'game', 'ott', 'subscription'])) {
      return 'Entertainment';
    }

    // Health
    if (this.hasKeywords(description, ['pharmacy', 'medical', 'hospital', 'clinic', 'health', 'doctor', 'medicine', 'apollo', 'medplus'])) {
      return 'Health';
    }

    // Education
    if (this.hasKeywords(description, ['school', 'college', 'education', 'course', 'tuition', 'book', 'learning', 'university'])) {
      return 'Education';
    }

    return 'Other';
  }

  /**
   * Check if description contains any of the given keywords
   */
  hasKeywords(description, keywords) {
    return keywords.some(keyword => description.includes(keyword));
  }

  /**
   * Calculate monthly income from received transactions
   */
  calculateMonthlyIncome(transactions, month, year) {
    const incomeTransactions = transactions.filter(t => {
      const date = new Date(t.created_at);
      return t.direction === 'received' && 
             date.getMonth() === month && 
             date.getFullYear() === year;
    });

    return incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  /**
   * Calculate spending by category for a specific month
   */
  calculateCategorySpending(transactions, month, year) {
    const spending = {};
    
    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.created_at);
      return t.direction === 'sent' && 
             date.getMonth() === month && 
             date.getFullYear() === year;
    });

    monthlyTransactions.forEach(t => {
      // Prefer the category explicitly selected during the payment process
      const selectedCategory = (t.category || '').trim();
      const category = selectedCategory && selectedCategory !== 'Other'
        ? selectedCategory
        : this.categorizeTransaction(t);
      spending[category] = (spending[category] || 0) + (t.amount || 0);
    });

    return spending;
  }

  /**
   * Generate personalized insights based on total balance
   */
  generatePersonalizedInsights(transactions, userBalance = 0) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Calculate spending
    const currentSpending = this.calculateCategorySpending(transactions, currentMonth, currentYear);
    const lastMonthSpending = this.calculateCategorySpending(transactions, lastMonth, lastMonthYear);

    const insights = [];

    // Use total balance as the base for spending limits
    let estimatedBalance = userBalance;
    
    // If no balance provided, estimate from recent credits
    if (estimatedBalance === 0) {
      const recentCredits = transactions
        .filter(t => t.direction === 'received')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      if (recentCredits.length > 0) {
        estimatedBalance = recentCredits.reduce((sum, t) => sum + t.amount, 0);
      }
    }

    // If still no balance, use a reasonable default
    if (estimatedBalance === 0) {
      const totalSpending = Object.values(currentSpending).reduce((sum, amount) => sum + amount, 0);
      estimatedBalance = totalSpending * 1.5; // Assume balance is 50% more than spending
    }

    // Generate insights for each category
    Object.keys(this.defaultLimits).forEach(category => {
      const currentAmount = currentSpending[category] || 0;
      const lastAmount = lastMonthSpending[category] || 0;
      const limit = this.defaultLimits[category];
      const limitAmount = (estimatedBalance * limit) / 100;
      const percentage = (currentAmount / estimatedBalance) * 100;

      // Overspending alert
      if (currentAmount > limitAmount && currentAmount > 0) {
        const overspendAmount = currentAmount - limitAmount;
        const overspendPercent = ((currentAmount - limitAmount) / limitAmount) * 100;
        
        insights.push({
          type: 'overspend',
          category: category,
          emoji: this.categoryEmojis[category],
          message: `You are overspending on ${category.toLowerCase()} this month ${this.categoryEmojis[category]}`,
          detail: `You spent ₹${currentAmount.toFixed(0)} (${percentage.toFixed(1)}% of balance) vs limit of ₹${limitAmount.toFixed(0)} (${limit}%)`,
          priority: 'high',
          overspendAmount: overspendAmount,
          overspendPercent: overspendPercent
        });
      }

      // Spending Trends: highlight notable increase vs last month
      if (lastAmount > 0 && currentAmount > lastAmount) {
        const increasePercent = ((currentAmount - lastAmount) / lastAmount) * 100;
        if (increasePercent >= 20) {
          insights.push({
            type: 'spending_trend_increase',
            category: category,
            emoji: this.categoryEmojis[category],
            message: `You've spent ${increasePercent.toFixed(0)}% more on ${category.toLowerCase()} this month compared to last month`,
            detail: `This month: ₹${currentAmount.toFixed(0)} • Last month: ₹${lastAmount.toFixed(0)}. Consider reviewing for deals or alternatives.`,
            priority: 'medium'
          });
        }
      }

      // Positive insights
      if (lastAmount > 0 && currentAmount < lastAmount) {
        const decreasePercent = ((lastAmount - currentAmount) / lastAmount) * 100;
        const savedAmount = lastAmount - currentAmount;
        
        if (decreasePercent > 15 && savedAmount > 500) { // Significant savings
          insights.push({
            type: 'savings',
            category: category,
            emoji: '🎉',
            message: `Great job! You saved ₹${savedAmount.toFixed(0)} on ${category.toLowerCase()} this month`,
            detail: `That's ${decreasePercent.toFixed(0)}% less than last month`,
            priority: 'low',
            savedAmount: savedAmount
          });
        }
      }
    });

    // General finance insights
    const totalSpending = Object.values(currentSpending).reduce((sum, amount) => sum + amount, 0);
    const spendingRatio = (totalSpending / estimatedBalance) * 100;
    const remainingBalance = estimatedBalance - totalSpending;
    const remainingPercent = (remainingBalance / estimatedBalance) * 100;

    // High spending alert
    if (spendingRatio > 80) {
      insights.push({
        type: 'high_spending',
        category: 'General',
        emoji: '⚠️',
        message: `You spent ${spendingRatio.toFixed(0)}% of your balance this month ⚠️`,
        detail: `Try to keep spending below 70% to maintain healthy balance`,
        priority: 'high'
      });
    }

    // Balance insights
    if (remainingPercent > 30) {
      insights.push({
        type: 'good_balance',
        category: 'Balance',
        emoji: '🎉',
        message: `You maintained ${remainingPercent.toFixed(0)}% of your balance this month 🎉`,
        detail: `Remaining balance: ₹${remainingBalance.toFixed(0)}`,
        priority: 'low'
      });
    } else if (remainingPercent < 20 && remainingPercent > 0) {
      insights.push({
        type: 'low_balance',
        category: 'Balance',
        emoji: '💡',
        message: `Your balance is running low – try to cut down on spending`,
        detail: `Only ${remainingPercent.toFixed(0)}% of your balance remaining (₹${remainingBalance.toFixed(0)})`,
        priority: 'medium'
      });
    }

    // Top spending categories (with percent of total)
    const sortedCategories = Object.entries(currentSpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (sortedCategories.length > 0) {
      const [topCat, topAmt] = sortedCategories[0];
      const topPct = totalSpending > 0 ? (topAmt / totalSpending) * 100 : 0;
      insights.push({
        type: 'top_category',
        category: topCat,
        emoji: '📊',
        message: `${topCat} was your top expense this month, totaling ₹${topAmt.toFixed(0)} (${topPct.toFixed(0)}% of spending)`,
        detail: `Top 3: ${sortedCategories.map(([cat, amount]) => `${cat} (₹${amount.toFixed(0)})`).join(', ')}`,
        priority: 'low'
      });
    }

    // Specific category insights
    this.generateSpecificInsights(currentSpending, lastMonthSpending, insights);

    // Bills spike reminder
    const billsNow = currentSpending.Bills || 0;
    const billsPrev = lastMonthSpending.Bills || 0;
    if (billsNow > billsPrev && billsPrev > 0) {
      const delta = billsNow - billsPrev;
      if (delta >= 800) {
        insights.push({
          type: 'bill_spike',
          category: 'Bills',
          emoji: '💡',
          message: `Your bills increased by ₹${delta.toFixed(0)} this month`,
          detail: `This month: ₹${billsNow.toFixed(0)} • Last month: ₹${billsPrev.toFixed(0)}. Consider checking usage or plan changes.`,
          priority: 'medium'
        });
      }
    }

    // End-of-month summary
    const lastTotalSpending = Object.values(lastMonthSpending).reduce((s, a) => s + a, 0);
    if (totalSpending > 0 || lastTotalSpending > 0) {
      const diff = totalSpending - lastTotalSpending;
      const down = diff < 0;
      insights.push({
        type: 'eom_summary',
        category: 'General',
        emoji: '🗓️',
        message: `This month you spent ₹${totalSpending.toFixed(0)}${down ? ` — ₹${Math.abs(diff).toFixed(0)} less than last month` : diff > 0 ? ` — ₹${diff.toFixed(0)} more than last month` : ''}`,
        detail: `Last month spending: ₹${lastTotalSpending.toFixed(0)}. Keep tracking your progress.`,
        priority: 'low'
      });
    }

    // Unusual activity alert (simple anomaly check vs last month or average of last two months when available)
    Object.keys(this.defaultLimits).forEach(category => {
      const nowAmt = currentSpending[category] || 0;
      const prevAmt = lastMonthSpending[category] || 0;
      const baseline = prevAmt; // with three months we could average; using last month for simplicity
      if (baseline > 0 && nowAmt >= baseline * 2.2 && nowAmt >= 3000) {
        insights.push({
          type: 'unusual_activity',
          category,
          emoji: '⚠️',
          message: `Unusual ${category.toLowerCase()} activity: ₹${nowAmt.toFixed(0)} vs usual ~₹${baseline.toFixed(0)}`,
          detail: `This is significantly higher than last month. Did you have a special event or travel?`,
          priority: 'high'
        });
      }
    });

    // Sort by priority and return top insights
    return insights
      .sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5); // Return top 5 insights
  }

  /**
   * Generate specific category insights with detailed messages
   */
  generateSpecificInsights(currentSpending, lastMonthSpending, insights) {
    // Food insights
    if (currentSpending.Food > 0) {
      const foodAmount = currentSpending.Food;
      const lastFoodAmount = lastMonthSpending.Food || 0;
      
      if (lastFoodAmount > 0) {
        const increase = ((foodAmount - lastFoodAmount) / lastFoodAmount) * 100;
        if (increase > 15) {
          insights.push({
            type: 'food_insight',
            category: 'Food',
            emoji: '🍔',
            message: `Your food expenses increased by ${increase.toFixed(0)}% compared to last month`,
            detail: 'Consider cooking at home more often to save money',
            priority: 'medium'
          });
        }
      }
    }

    // Shopping insights
    if (currentSpending.Shopping > 0) {
      const shoppingAmount = currentSpending.Shopping;
      const lastShoppingAmount = lastMonthSpending.Shopping || 0;
      
      if (lastShoppingAmount > 0) {
        const increase = ((shoppingAmount - lastShoppingAmount) / lastShoppingAmount) * 100;
        if (increase > 25) {
          insights.push({
            type: 'shopping_insight',
            category: 'Shopping',
            emoji: '🛒',
            message: `Your shopping expenses are ${increase.toFixed(0)}% higher than your average`,
            detail: 'Try to reduce impulse purchases and stick to a shopping list',
            priority: 'medium'
          });
        }
      }
    }

    // Travel insights
    if (currentSpending.Travel > 0) {
      const travelAmount = currentSpending.Travel;
      const lastTravelAmount = lastMonthSpending.Travel || 0;
      
      if (lastTravelAmount > 0) {
        const increase = ((travelAmount - lastTravelAmount) / lastTravelAmount) * 100;
        if (increase > 100) { // Double spending
          insights.push({
            type: 'travel_insight',
            category: 'Travel',
            emoji: '🚌',
            message: `Your cab expenses are ${increase.toFixed(0)}× higher than last month 🚕`,
            detail: 'Consider using public transport or carpooling to save money',
            priority: 'medium'
          });
        }
      }
    }
  }

  /**
   * Get spending summary for dashboard
   */
  getSpendingSummary(transactions, userBalance = 0) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentIncome = this.calculateMonthlyIncome(transactions, currentMonth, currentYear);
    const currentSpending = this.calculateCategorySpending(transactions, currentMonth, currentYear);
    const lastMonthSpending = this.calculateCategorySpending(transactions, lastMonth, lastMonthYear);

    return {
      currentIncome,
      currentSpending,
      lastMonthSpending,
      estimatedBalance: userBalance || this.estimateBalanceFromSpending(currentSpending),
      categoryLimits: this.defaultLimits
    };
  }

  /**
   * Estimate balance from spending patterns
   */
  estimateBalanceFromSpending(spending) {
    const totalSpending = Object.values(spending).reduce((sum, amount) => sum + amount, 0);
    return totalSpending * 1.5; // Assume balance is 50% more than spending
  }
}

module.exports = new PersonalizedInsightsService();
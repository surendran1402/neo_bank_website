import { bankingAPI } from './api';

// Banking service using API
class BankingService {
  // Link bank account
  async linkBankAccount(userId, bankCredentials) {
    try {
      const response = await bankingAPI.linkBankAccount(
        bankCredentials.bankName,
        bankCredentials.institution
      );

      if (response.success) {
        return {
          success: true,
          bankAccount: response.bankAccount,
          message: response.message
        };
      } else {
        return {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error('Link bank account error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to link bank account'
      };
    }
  }

  // Create verified funding source
  async createFundingSource(userId, accessToken, bankAccountId) {
    try {
      // This would typically involve creating a funding source record
      // For now, we'll return a success response
      const fundingSource = {
        id: `fs_${Math.random().toString(36).substr(2, 15)}`,
        userId,
        bankAccountId,
        accessToken,
        status: 'verified',
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        fundingSource,
        message: 'Funding source created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Transfer funds
  async transferFunds(senderId, recipientPublicId, amount, description = '') {
    try {
      const response = await bankingAPI.transferFunds(
        recipientPublicId,
        amount,
        description
      );

      if (response.success) {
        return {
          success: true,
          transaction: response.transaction,
          message: response.message
        };
      } else {
        return {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error('Transfer funds error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Transfer failed'
      };
    }
  }

  // Find user by public ID
  async findUserByPublicId(publicId) {
    try {
      const response = await bankingAPI.findUser(publicId);

      if (response.success) {
        return response.user;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Find user error:', error);
      return null;
    }
  }

  // Get transaction history
  async getTransactionHistory(userId, page = 1, limit = 20) {
    try {
      const response = await bankingAPI.getTransactions(page, limit);

      if (response.success) {
        return {
          success: true,
          transactions: response.transactions,
          pagination: response.pagination
        };
      } else {
        return {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error('Get transaction history error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch transaction history'
      };
    }
  }

  // Get account balance
  async getAccountBalance(accountId) {
    try {
      const response = await bankingAPI.getBalance();

      if (response.success) {
        // Find the specific account if accountId is provided
        if (accountId) {
          const account = response.accounts.find(acc => acc.id === accountId);
          return {
            success: true,
            balance: account ? account.balance : 0
          };
        } else {
          // Return total balance
          return {
            success: true,
            balance: response.totalBalance
          };
        }
      } else {
        return {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error('Get account balance error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch account balance'
      };
    }
  }

  // Get user's bank accounts
  async getUserBankAccounts(userId) {
    try {
      const response = await bankingAPI.getAccounts();

      if (response.success) {
        return {
          success: true,
          bankAccounts: response.bankAccounts
        };
      } else {
        return {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error('Get user bank accounts error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch bank accounts'
      };
    }
  }
}

export default new BankingService(); 
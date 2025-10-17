const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neobank';

class Database {
  constructor() {
    this.isConnected = false;
  }

  // Connect to MongoDB
  async connect() {
    try {
      if (this.isConnected) {
        console.log('Already connected to MongoDB');
        return;
      }

      await mongoose.connect(MONGODB_URI);

      this.isConnected = true;
      console.log('Connected to MongoDB successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  // Disconnect from MongoDB
  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('MongoDB connection closed');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const database = new Database();

module.exports = database; 
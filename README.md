# NeoBank App

A modern banking application with secure account management and fund transfers, now with full database integration.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with password hashing
- 💳 **Bank Account Management**: Link and manage multiple bank accounts
- 💸 **Fund Transfers**: Send money to other users using public IDs
- 📊 **Transaction History**: View detailed transaction records with pagination
- 🛡️ **Security**: Rate limiting, CORS protection, and input validation
- 🗄️ **Database Storage**: MongoDb database for persistent data storage

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Axios for API calls
- React Router for navigation

### Backend
- Node.js with Express
- Mongodb database
- JWT authentication
- bcryptjs for password hashing
- Express validation and rate limiting

## Database Schema

The application uses SQLite with the following tables:

- **users**: User accounts and authentication
- **bank_accounts**: Linked bank account information
- **transactions**: Transfer and transaction records
- **funding_sources**: Funding source management

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd neobank-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run init-db
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

### Alternative: Run servers separately

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Banking
- `POST /api/banking/link-account` - Link bank account
- `GET /api/banking/accounts` - Get user's bank accounts
- `POST /api/banking/transfer` - Transfer funds
- `GET /api/banking/transactions` - Get transaction history
- `GET /api/banking/balance` - Get account balance
- `GET /api/banking/find-user/:publicId` - Find user by public ID

### Health Check
- `GET /api/health` - API health status

## Environment Variables

Create a `server/config.env` file with the following variables:

```env
# Database Configuration
DB_PATH=./database/neobank.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
BCRYPT_ROUNDS=12
```

## Database Location

The SQLite database is stored at:
```
server/database/neobank.db
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured CORS for security
- **Helmet**: Security headers middleware

## Data Migration from localStorage

If you have existing data in localStorage, you'll need to:

1. Register new accounts through the API
2. Re-link bank accounts
3. Previous transaction data will not be migrated (as it was temporary)

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment variables
2. Update CORS origins in `server/index.js`
3. Use a production database (PostgreSQL, MySQL) instead of SQLite
4. Set a strong JWT secret
5. Configure proper SSL/TLS certificates
6. Set up proper logging and monitoring

## Troubleshooting

### Common Issues

1. **Database not found**: Run `npm run init-db` to create the database
2. **Port already in use**: Change the PORT in config.env or kill the process using the port
3. **CORS errors**: Ensure the frontend URL is correctly configured in the backend CORS settings

### Logs

Check the console output for detailed error messages and API request logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 
# Next-StockMarket

An Indian Stock Market Dashboard built with Next.js 15, featuring real-time market data, interactive charts, and an expert blog system.

## Features

- **Market Dashboard**: Real-time Indian stock market indices (NIFTY50, SENSEX, BANKNIFTY, NIFTYIT)
- **Interactive Charts**: Line charts, bar charts, and doughnut charts using Chart.js
- **Market Data**: Top gainers, top losers, sector performance, market statistics
- **Expert Blog System**: Financial experts can write and publish market analysis
- **Expert Authentication**: Secure login with secret code registration

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens with bcryptjs

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
MONGO_URL=your_base64_encoded_mongodb_url
TOKEN_SECRET=your_base64_encoded_secret
ALPHA_VANTAGE_API_KEY=your_api_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── blogs/                # Expert blogs listing
│   │   └── [id]/             # Individual blog view
│   ├── expert/
│   │   ├── login/            # Expert login
│   │   ├── signup/           # Expert registration
│   │   ├── profile/          # Expert profile management
│   │   └── write-blog/       # Blog writing page
│   └── api/
│       ├── stocks/           # Stock market APIs
│       ├── expert/           # Expert auth APIs
│       └── blogs/            # Blog CRUD APIs
├── models/
│   ├── expertModel.js        # Expert user schema
│   └── blogModel.js          # Blog post schema
├── helpers/
│   └── getDataFromToken.ts   # JWT token extraction
└── middleware.ts             # Route protection
```

## Expert Registration

Experts need a secret code to register: `ZBK897`

## API Routes

### Stock Market
- `GET /api/stocks/market` - Market overview with indices, gainers, losers
- `GET /api/stocks/quote?symbol=RELIANCE.BSE` - Individual stock quote
- `GET /api/stocks/history?symbol=RELIANCE.BSE` - Historical data

### Expert Auth
- `POST /api/expert/signup` - Register new expert
- `POST /api/expert/login` - Expert login
- `GET /api/expert/me` - Get current expert
- `PUT /api/expert/profile` - Update expert profile

### Blogs
- `GET /api/blogs` - List all blogs
- `POST /api/blogs` - Create new blog (experts only)
- `GET /api/blogs/[id]` - Get single blog

## License

MIT

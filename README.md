# Penny Wise - Personal Finance Assistant

A modern, AI-powered personal finance assistant built with Next.js, featuring real-time market analysis, portfolio tracking, and intelligent chat integration.

## Features

### 🤖 AI-Powered Chat Assistant

- Interactive financial advice and analysis
- Natural language portfolio queries
- Real-time market insights
- Portfolio performance analysis

### 📊 Market Analytics

- Real-time stock quotes and analysis
- Portfolio performance tracking
- Market trends and insights
- Alpha Vantage and Yahoo Finance integration

### 🔔 Smart Notifications

- Price alerts and portfolio updates
- Customizable notification preferences
- Real-time market alerts

### 📈 Dashboard

- Comprehensive portfolio overview
- Interactive charts and visualizations
- Performance metrics and analytics

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **API Integration**: Alpha Vantage, Yahoo Finance
- **State Management**: Zustand
- **Charts**: Recharts
- **Styling**: Tailwind CSS with custom components

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/rafaelfonts/penny-wise.git
cd penny-wise
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALPHA_VANTAGE_API_KEY`

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── ...
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard components
│   └── ...
├── lib/                  # Utilities and configurations
│   ├── supabase/         # Database client
│   ├── services/         # External API services
│   └── ...
└── hooks/                # Custom React hooks
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Market data from [Alpha Vantage](https://www.alphavantage.co/)
- UI components from [Radix UI](https://www.radix-ui.com/)

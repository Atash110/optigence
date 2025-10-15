# 🚀 Optigence - Super Agentive AI Platform

Optigence is a revolutionary AI platform that transforms how users interact with technology through intelligent, minimal-input agents. Each module is designed to understand your intent and act on your behalf with sophisticated AI assistance.

## ✨ Features

- **🤖 Superficial AI Assistant**: Floating chat agent with intent detection and voice input
- **📧 OptiMail**: Smart AI email assistant for composing, translating, and managing emails
- **🛍️ Shopora**: Intelligent shopping agent for product recommendations and price comparisons  
- **💼 Jobvera**: Career assistant for resume optimization, job matching, and interview prep
- **🌍 TravelBuddy**: Travel companion for trip planning and connecting with fellow travelers
- **🌐 Multilingual**: Support for 10+ languages (English, Azerbaijani, Turkish, Spanish, Chinese, German, French, Russian, Hindi, Arabic)
- **🎨 Modern UI**: Minimalist design with navy-blue theme and smooth animations
- **📱 Responsive**: Mobile-first design that works across all devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router and TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth transitions
- **State Management**: Zustand for global state management
- **AI Integration**: OpenAI GPT-4 for intent detection and content generation
- **Database**: Supabase for user data and templates
- **Internationalization**: Custom multilingual system with Zustand
- **Authentication**: Basic authentication middleware (MVP)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (optional for full functionality)
- Supabase account (optional for data persistence)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/optigence.git
   cd optigence
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
optigence/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── globals.css     # Global styles and Tailwind imports
│   │   ├── layout.tsx      # Root layout with theme and i18n
│   │   ├── page.tsx        # Landing page with waitlist
│   │   ├── mailgent/       # Email assistant module (protected)
│   │   ├── shopora/        # Shopping assistant module (protected)
│   │   ├── jobvera/        # Career assistant module (protected)
│   │   └── travelbuddy/    # Travel assistant module (protected)
│   ├── components/         # Reusable React components
│   │   ├── Layout.tsx      # Main layout wrapper
│   │   ├── Header.tsx      # Navigation header
│   │   ├── Sidebar.tsx     # Collapsible sidebar
│   │   └── SuperficialAssistant.tsx  # Floating AI chat agent
│   ├── store/              # Zustand state management
│   │   ├── app.ts          # Global app state
│   │   └── language.ts     # Internationalization store
│   └── types/              # TypeScript type definitions
│       └── index.ts        # Core type definitions
├── middleware.ts           # Next.js middleware for authentication
├── tailwind.config.ts      # Tailwind CSS configuration
└── next-i18next.config.js  # Internationalization configuration
```

## 🔐 Authentication (MVP)

The AI modules are protected with basic authentication:
- **Username**: `optigence`
- **Password**: `creaiopt8585`

This can be configured in the environment variables or `middleware.ts`.

## 🎨 Design System

Optigence uses a carefully crafted design system:

- **Colors**: Navy-blue primary (#1E3A8A), white backgrounds, minimal palette
- **Typography**: Inter font family for readability
- **Animations**: Subtle hover effects, typing animations, smooth transitions
- **Layout**: Mobile-first responsive design with collapsible sidebar
- **Components**: Consistent styling with Tailwind utility classes

## 🌍 Internationalization

The platform supports 10 languages with easy switching:

- 🇺🇸 English (default)
- 🇦🇿 Azerbaijani  
- 🇹🇷 Turkish
- 🇪🇸 Spanish
- 🇨🇳 Chinese
- 🇩🇪 German
- 🇫🇷 French
- 🇷🇺 Russian
- 🇮🇳 Hindi
- 🇸🇦 Arabic (with RTL support)

## 🤖 AI Integration

The Superficial Assistant uses OpenAI GPT-4 for:
- Intent detection and routing
- Natural language understanding
- Context-aware responses
- Module-specific assistance

## 📱 Modules Overview

### 📧 OptiMail - Smart Email Assistant
- Compose emails from natural language intent
- Multiple tone options (formal, friendly, assertive, empathetic)
- Instant translation capabilities
- Template saving and management
- Reply suggestions based on context

### 🛍️ Shopora - Smart Shopping Agent  
- Product search and recommendations
- Price comparison across platforms
- Review analysis and summaries
- "Worth buying" AI recommendations
- Personal shopping preferences learning

### 💼 Jobvera - Smart Career Assistant
- Resume optimization and enhancement
- Job matching based on skills and preferences
- Interview preparation with mock questions
- Application tracking dashboard
- Follow-up email generation

### 🌍 TravelBuddy - Smart Travel & Social Companion
- Complete trip itinerary planning
- Flight, hotel, and activity recommendations
- Fellow traveler matching
- Local cultural insights and safety tips
- Budget-aware trip optimization

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in the Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy your app

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@optigence.com
- 💬 Discord: [Join our community](https://discord.gg/optigence)
- 📚 Documentation: [docs.optigence.com](https://docs.optigence.com)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Animated with [Framer Motion](https://www.framer.com/motion/)
- AI powered by [OpenAI](https://openai.com/)
- Database by [Supabase](https://supabase.com/)

---

**Optigence** - The future of AI assistance is here. 🚀
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

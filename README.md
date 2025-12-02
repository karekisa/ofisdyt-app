# Diyetlik - Diyetisyenler İçin Dijital Asistan

Diyetisyenler için profesyonel danışan yönetimi, randevu takibi ve dijital asistan platformu. Next.js 14, Tailwind CSS ve Supabase ile geliştirilmiştir.

## Features

- 🔐 **Authentication** - Secure email/password login and signup
- 👥 **Client Management** - Full CRUD operations for client records
- 📊 **Progress Tracking** - Weight and body fat measurements with visual charts
- 📅 **Appointment Calendar** - View and manage appointments by date
- 🌐 **Public Booking** - Shareable booking page for clients
- 📱 **Mobile-First Design** - Responsive UI optimized for mobile devices
- 🎨 **Medical Green Theme** - Professional color scheme

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Date Picker:** react-day-picker

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Setup Instructions

1. **Clone the repository and install dependencies:**

```bash
npm install
```

2. **Set up Supabase:**

   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the SQL from `supabase-schema.sql`
   - Go to Project Settings > API and copy your:
     - Project URL
     - Anon/Public key

3. **Configure environment variables:**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run the development server:**

```bash
npm run dev
```

5. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/          # Authentication page
│   ├── (dashboard)/
│   │   ├── layout.tsx      # Dashboard layout with navigation
│   │   ├── page.tsx        # Dashboard home
│   │   ├── clients/        # Client management
│   │   ├── calendar/       # Appointment calendar
│   │   └── settings/       # Profile settings
│   └── book/
│       └── [slug]/         # Public booking page
├── lib/
│   ├── supabase.ts         # Supabase client configuration
│   └── types.ts            # TypeScript types
└── middleware.ts           # Route protection middleware
```

## Database Schema

The application uses the following main tables:

- **profiles** - Dietitian profile information
- **clients** - Client records
- **appointments** - Appointment bookings
- **measurements** - Weight and body fat measurements

See `supabase-schema.sql` for the complete schema with Row Level Security policies.

## Features in Detail

### Mobile-First Navigation

- **Desktop:** Fixed sidebar on the left
- **Mobile:** Hamburger menu with drawer + bottom navigation bar

### Client Management

- Searchable client list
- Client detail page with tabs:
  - **Info:** Basic client information
  - **Measurements:** Add and view weight/body fat history
  - **Progress:** Visual charts showing weight trends

### Public Booking

- Dietitians can set a unique `public_slug` in settings
- Clients can book appointments via `/book/[slug]`
- Appointments are created with `pending` status for approval

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables
4. Deploy!

### Environment Variables for Production

Make sure to set the same environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## License

This project is private and proprietary.

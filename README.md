# Gems of India 🇮🇳

**Gems of India** (https://gemsofindia.org) is a community-driven platform to rate and review government officials and politicians in India, from the village to the central level. The goal is to bring transparency, accountability, and awareness about those who serve the nation.

This platform allows users to:

- Search for any politician or government officer.
- Submit reviews on their performance.
- Upload verified evidence or references.
- Explore top-rated and lowest-rated officials.
- Report corruption.

This platform is not about hate; it's about accountability.

## Getting Started

This is a [Next.js](https://nextjs.org/) project. Follow the instructions below to get it up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v22.x or later)
- [pnpm](https://pnpm.io/) (v10 or later)
- [PostgreSQL](https://www.postgresql.org/)

### Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/varunmara/gems-of-india.git
    cd gems-of-india
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**

    Copy the `.env.example` file to a new file named `.env`:

    ```bash
    cp .env.example .env
    ```

    Open `.env` and update the variables with your own values. At a minimum, you'll need to provide the `DATABASE_URL` for your PostgreSQL database.

4.  **Set up the database:**

    Run the following command to apply the database schema:

    ```bash
    pnpm run db:push
    ```

5.  **Run the development server:**
    ```bash
    pnpm run dev
    ```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Available Scripts

This project includes the following scripts, which can be run with `pnpm run <script_name>`:

- `dev`: Starts the development server using Next.js with Turbopack.
- `build`: Creates a production-ready build of the application.
- `start`: Starts the production server.
- `lint`: Lints the codebase using Next.js's built-in ESLint configuration.
- `db:generate`: Generates database migration files with Drizzle Kit.
- `db:migrate`: Applies generated migrations to the database.
- `db:push`: Pushes the schema directly to the database (useful for development).
- `db:studio`: Opens Drizzle Studio, a GUI for your database.
- `categories`: A script for managing categories.

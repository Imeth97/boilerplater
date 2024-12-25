# Boilerplater

Boilerplater is a Next.js-based project designed to streamline the setup of authentication and database integration for your applications. This boilerplate provides robust tools and workflows to help you kickstart your project with minimal effort.

## Features

- **Built with Next.js**:

  - Scalable and modern React framework.
  - Making usage of server functions, server actions & route handlers.
  - [Next.js Documentation](https://nextjs.org/).

- **Authentication with NextAuth**:

  - Full email and password implementation.
  - Sessions management.
  - [NextAuth Documentation](https://next-auth.js.org/).

- **PostgreSQL Database Integration with Drizzle ORM**:

  - Fully connected to manage users and session data.
  - [Drizzle ORM Documentation](https://orm.drizzle.team/)

- **UI**:

  - Fully integrated with Shadcn/UI. [Shadcn/UI](https://ui.shadcn.com/)
  - Lucide Icons. [Lucide Icons](https://lucide.dev/)
  - Easy inline styling with Tailwind CSS. [Tailwind CSS](https://tailwindcss.com/)
  - Easy form handling with React Hook Form. [React Hook Form](https://react-hook-form.com/)

- **Zod**
  - Easy form & api validation. [Zod](https://zod.dev/)

## Getting Started

### Prerequisites

- Ensure **Docker** is running in the background.

### Steps to Run

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd boilerplater
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Run the development server:
   ```bash
   yarn dev-all
   ```
   See localhost:3000 in your browser.

Todos:

- checkAuth function - need to find a better way to check if the user is authenticated at the middleware level
- reset password tokens - need to find a way to handle token revocation to avoid replay attacks
- Deployment to AWS:
  main.tf file exists but may require updating.

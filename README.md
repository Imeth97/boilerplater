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

- **UI Components**:

  - Fully integrated with Shadcn/UI. [Shadcn/UI](https://ui.shadcn.com/)
  - Lucide Icons. [Lucide Icons](https://lucide.dev/)

- **Tailwind CSS**

  - Easy inline styling. [Tailwind CSS](https://tailwindcss.com/)

- **React Hook Form**

  - Easy form handling. [React Hook Form](https://react-hook-form.com/)

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

- Email Account Confirmation and Reset:
  Implement functionality for email verification and password reset.
- Deployment to AWS:
  main.tf file exists but may require updating.

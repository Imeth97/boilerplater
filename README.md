# Boilerplater

Next.js boilerplate that comes set up with a full postgres database integration (using drizzle) and a full NextAuth credentials implementation (the entire flow, with email confirmation etc.).
See below for more details + how to clone and run the boilerplate.

## Features

- **Built with Next.js**:

  - Scalable and modern React framework.
  - Making usage of server functions, server actions & route handlers.
  - [Next.js Documentation](https://nextjs.org/).

- **Authentication with NextAuth - Why pay for a service when you can do it yourself easily?**:

  - Full email and password (credentials provider) implementation with sessions.
  - Email confirmation and password reset with JWT.
  - [Nodemailer](https://nodemailer.com/) for email sending.
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

- **Testing**

  - Unit testing with Vitest. [Vitest](https://vitest.dev/)

## Getting Started

### Prerequisites

- Ensure **Docker** is running in the background.

### Steps to Run locally

(Feel free to use your favourite package manager instead of yarn - just consider deleting the yarn.lock file if you do so!)

1. Clone the repository:
   ```bash
   # clone the repo, and go to its top level
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
   This will generate the required .env file and start both the local database and the development server.
   See localhost:3000 in your browser.

**ENVs - a script is provided to generate the env file:**
However, you can also create the .env file manually at the root of the project with the following:

- EMAIL_VERIFICATION_SECRET= generate a random hash
- EMAIL_PASSWORD_RESET_SECRET= generate a random hash
- NEXTAUTH_SECRET= generate a random hash
- NEXT_PUBLIC_BASE_URL=http://localhost:3000 or your custom base url
- NEXT_DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb for local or your custom database url
- AUTH_DRIZZLE_URL=postgresql://myuser:mypassword@localhost:5432/mydb for local or your custom database url
- SMTP_SERVER_HOST= e.g. smtp.gmail.com
- SMTP_SERVER_USERNAME= your email
- SMTP_SERVER_PASSWORD= your email password. For gmail, you must use an app password. For this, enable 2-step verification on your google account and create an app password.
- SMTP_SERVER_PORT=587 or whatever port your email provider uses
- SMTP_SERVICE= e.g. gmail

Important:
Please note that depending on your email provider, the configuration might be different and may require more env variables.
Also make sure to update the .env file with the correct values and ensure security with the secrets and
passwords when deploying to production or uploading your code to a public repo.
Remember that regenerating secrets will invalidate all existing tokens.

**Todos:**

High Priority:

- email spam - need to implement a way to prevent email spamming
- checkAuth function - need to find a better way to check if the user is authenticated at the middleware level as drizzle queries do not work on the edge runtime
- reset password tokens - need to find a way to handle token revocation to avoid replay attacks (redis/dynamodb?)

Low Priority:

- rabbitmq - need to implement a message queue for email sending
- Deployment to AWS: main.tf file exists but may require updating.

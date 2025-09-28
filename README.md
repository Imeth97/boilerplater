[![Build/CI](https://github.com/Imeth97/boilerplater/actions/workflows/build-ci.yml/badge.svg)](https://github.com/Imeth97/boilerplater/actions/workflows/build-ci.yml)

# Boilerplater

Next.js boilerplate that comes set up with a full postgres database integration (using drizzle) and a full NextAuth credentials implementation (the entire flow, with email confirmation etc.).
See below for more details + how to clone and run the boilerplate.

## Features

- **Built with Next.js**:

  - Scalable and modern React framework.
  - Making usage of server functions, server actions & route handlers.
  - [Next.js Documentation](https://nextjs.org/).

- **Authentication with NextAuth - Fully managed on your own DB. No 3rd party costs.**:

  - Full email and password (credentials provider) implementation with sessions.
  - Email confirmation and password reset with JWT.
  - Implementation alongside OAuth providers with account clash handling. A Github implementation is included and can be setup with the AUTH_GITHUB_ID and AUTH_GITHUB_SECRET env variables.
    - See more details [here](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
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
   
   A locally running Greenmail smtp container will also be spawned. After invoking the signup flow (with e.g. test@localhost.com) you can run 
   ```
   scripts/mail/extract-signup-link.sh test@localhost.com X 
   ```
   To get the sign up link to invoke email confirmation. 

### Deployments 

Checkout the release/vercel-neon to see a production deployment of this boilerplate using vercel for hosting and neon for the postgres provider. 
Diff that branch with main to see what changes were required for deployment. 

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

## DOCS

Authentication Flows (Credentials):

User signs up with email and password

1. Validation - user cannot already exist, email & password must be valid etc.
2. User is created in DB by email
3. Confirmation email is sent with signed token
4. User is signed in (as an unverified account)

Email confirmation flow

1. User opens email with confirmation link
2. Link is opened and token verified

Set/Forgot password flow

1. User opts to reset password via button (or enters email as forgot password flow)
2. Email is sent with signed token in link to reset password
3. User opens email & clicks link
4. Link opens & token is verified
5. User resets password - db update
6. User is signed out
7. User can sign in again with new password

Clash scenarios:
User signed in previously via email & now uses OAuth (e.g. github)

1. account-linking.ts - check if user already exists under a seperate provider
2. If so - link the account and continue with oauth sign in
3. User can now continue to use this oauth + their email/password if they please

User signed in previously via Oauth & now uses Email/Password:

1. Check if the user's email exists in DB with a different provider
2. If so, route them to page showing AccountResolution.tsx - notify them they previously used X provider but can set a password
   via the Set password flow

### Password Reset Token Revocation

Our password reset flow uses **opaque, single-use tokens** stored in the database.

When a user requests a reset link:

- Any existing unused reset tokens for that user are immediately invalidated.
- A new random token is generated, hashed, stored with an expiry time, and sent to the user with its token ID.

When the link is used:

- The system verifies the token against the database in a single transaction.
- If valid, the password is updated, the token is marked as used, and the user’s `reset_nonce` is incremented.
- Incrementing `reset_nonce` ensures all other outstanding tokens for that user are invalidated.

This guarantees:

- **One-time use** — links cannot be reused.
- **Instant invalidation** — all tokens for a user can be killed at once.
- **No reliance on JWT expiry alone** — the database is the single source of truth.

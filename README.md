# Boilerplater

Boilerplater is a Next.js-based project designed to streamline the setup of authentication and database integration for your applications. This boilerplate provides robust tools and workflows to help you kickstart your project with minimal effort.

## Features

- **Authentication with NextAuth**:

  - Full email and password implementation.
  - Sessions management.
  - [NextAuth Documentation](https://next-auth.js.org/).

- **Database Integration with Drizzle ORM**:

  - Uses PostgreSQL as the database.
  - Fully connected to manage users and session data.
  - [Drizzle ORM Documentation](https://orm.drizzle.team/)

- **Built with Next.js**:
  - Scalable and modern React framework.
  - [Next.js Documentation](https://nextjs.org/).

## Getting Started

### Prerequisites

- Ensure **Docker** is running in the background.
- Install dependencies using `yarn` or `npm`.

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
   yarn dev
   ```
   See localhost:3000 in your browser.

Todos:

- Email Account Confirmation and Reset:
  Implement functionality for email verification and password reset.
- Deployment to AWS:
  Update the existing main.tf file for AWS deployment.

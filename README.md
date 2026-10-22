https://ui-thing.behonbaker.com/getting-started/setup#theme-source

## Database

The app uses MariaDB through Prisma. Copy `.env.example` to `.env` and set
`DATABASE_URL` to your MariaDB connection string, for example, and
`FILE_STORAGE_MOUNT` to the absolute directory where uploaded profile images
should be stored (defaults to `/media/storage`):

```text
mysql://USER:PASSWORD@HOST:3306/DATABASE
```

The active Prisma migration directory is `prisma/migrations-mariadb`; the
existing SQLite migrations remain in `prisma/migrations`. The MariaDB baseline
is generated from the current models and can be applied to a new database with
`yarn prisma migrate deploy`. Existing SQLite data is not copied to MariaDB.

## Docker

Build the production image with `docker build -t mefaitrien .`, then provide
`DATABASE_URL` and the app's required auth environment variables at runtime.
The Nuxt server listens on port 3000. Database migrations are not run
automatically by the container.

## Calendar subscriptions

Users can create a private cooking calendar link from **Instellingen**. The
feed is available at `/api/calendar/{userId}/{token}.ics`; treat the tokenized
URL as a secret. Creating a new link revokes the previous one.

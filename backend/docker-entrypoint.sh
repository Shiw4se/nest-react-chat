#!/bin/sh
# Applies pending migrations, optionally (re)seeds the demo data, then starts
# the API. SEED_DEMO=true resets the demo accounts on every start, which keeps
# a public demo clean; real users are never touched.
set -e

npx prisma migrate deploy

if [ "$SEED_DEMO" = "true" ]; then
  node dist/seed/seed.js
fi

exec node dist/main.js

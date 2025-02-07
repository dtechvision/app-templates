# Using Effect with Remix

- [Remix Docs](https://remix.run/docs)
- [Effect Docs](https://effect.website/docs/introduction)
- [Vite Docs](https://vitejs.dev/guide/)

## Project Goals

Prototype an integration of Remix + Effect in such a way that the Effect runtime is only ever executed in the backend while keeping the frontend code minimal and fully type safe.

This project aims to demonstrate integration of Effect in one typical setup where the user is not in control of the program entrypoints that are delegated to frameworks, similar scenarios are for example the usage of Next.js or equivalent frameworks.

## Development

### Setup

First get dependencies

```
bun install
```

The project expects a `.env` file in the root directory. Use `.env.template` as a template.

To ensure your `.env.template` stays in sync with `.env` in your terminal execute:

```sh
./scripts/dotenv.sh
```

this is already setup to run on each precommmit via husky. If you want to rename the env file, please adjust the script or pass in the parameter.

### Get up and running

From your terminal:

```sh
bun run dev
```

This starts your app in development mode, rebuilding assets on file changes.

using ```docker-compose up -d``` you start local telemetry and database containers

to verify the TODOs are properly reflected in the db you can query them with ```docker-compose exec postgres psql -U postgres -d effect_pg_dev -c "SELECT * FROM todos ORDER BY created_at DESC;"```

For Database migrations:

```sh
bun run migrate
```

## Deployment

First, build your app for production:

```sh
bun run build
```

Then run the app in production mode:

```sh
bun run start
```

Now you'll need to pick a host to deploy it to.

## Telemetry

If you want to see telemetry data this project is configured to work with [https://www.honeycomb.io/](https://www.honeycomb.io/), create an account if you don't have one (they have a very nice free tier) and write your project name & api key in a file called `.env`, follow the template `.env.template`

Note: if you want to change the backend you use for tracing, for example using your own [grafana tempo](https://grafana.com/oss/tempo/) you'll need to edit `.env` and provide the options. For defaults check `app/services/Telemetry.ts`.

This setup provides
1) Structured logging with different levels for development and production
1) Detailed tracing of database operations and service calls
1) Span annotations for better context in traces
1) Error logging with proper context
1) Integration with OpenTelemetry for distributed tracing

To visualize the telemetry data, you can:
- Use Grafana Tempo for distributed tracing visualization
- Set up Grafana Loki for log aggregation
- Configure Prometheus for metrics collection

### Effect Dev Tools (Recommended for Development)

>**NOTICE**: when enabling dev tools you'll only see traces in the IDE DevTools, **NOT** your OTEL endpoint!!!
>To enable uncomment the layer in `services/Telemetry.ts`

View traces, metrics and inspect the context directly in VSCode:

1. Install the Effect Dev Tools extension from [VSCode marketplace](https://marketplace.visualstudio.com/items?itemName=effectful-tech.effect-vscode)
1. Open the Effect Dev Tools panel in VSCode
1. Click "Start the server" in the "Clients" panel
1. Start your application

### The full telemetry stack

in the `docker-compose.yml` we include grafana, tempo and prometheus to have all telemetry collected.

to test that you are recieving traces there's a helper script sending a testTrace ```sendTestTrace.sh``` which you can run in the terminal.

To visualize access the services
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

Datasources for Grafana shall be
- Tempo: http://localhost:3200
- Prometheus: http://localhost:9090

>Note: When using Colima on Mac instead of Docker Desktop, if you can't access the local services add ```propagateProxyEnv: true``` instead of it missing or being `null` in your config.
>The colima config if installed via brew resides in ```~/.colima/_lima/colima/colima.yaml``` it may also be in `~/.lima/` we'd suggest looking for it. The file will be called `colima.yaml`.

## Project Setup

This project uses a nightly build of remix in order to use it together with vite. Apart from that it looks like a normal vite project.

The key configurations for vite are found in the `vite.config.ts` file that looks like:

```ts
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    babel({
      filter: new RegExp(/\.tsx?$/),
    }),
    remix(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "build",
    copyPublicDir: false,
    minify: "terser",
  },
  publicDir: "./public",
});
```

Namely here we are setting up Remix together with babel, in babel we use a plugin to annotate pure calls so that we can tree-shake loaders and actions that use higher order functions.

In short this setup enables us to use and tree-shake the following pattern:

```tsx
export const loader = effectLoader(effect);
export const action = effectAction(effect);

export default function Component() {
  // plain component
}
```

## Code Structure

The project uses 4 main libraries of the effect ecosystem:

- `effect` to handle all effectful operations
- `@effect/schema` to define data models and handle serialization
- `@effect/opentelemetry` to integrate with a telemetry dashboard
- `@effect/sql` to integrate with postgres

The directories are structured in the following way:

- `/app` contains all the app code
  - `/lib` contains integration code with effect (and a temporary hack to load opentelemetry from esm due to improper es modules)
  - `/migrations` contains all the database migration code, those are automatically loaded by the sql client
  - `/routes` contains the remix routes, loaders and actions
  - `/services` contains the business logic encapsulated in effect services

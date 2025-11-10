# OSHViewer

## Working with the project locally

install Node.js and npm if you haven't already. You can download them from
the [Node.js official website](https://nodejs.org/).
Install the Node.js dependencies:

```bash
npm install
```

Run the project in development mode:

```bash
npm run dev
```

## Creating a reusable Docker Container

Build the project bundle:

```bash
npm run build
```

In the project root directory, run the following command to build the Docker image:

```bash
docker build --no-cache --pull -f server/Dockerfile -t osh-viewer-test /home/cr31/OSH/Projects/osh-viewer/
```

Then this command to save the image to a tar file:

```bash
docker save -o osh-viewer-test.tar osh-viewer-test
```

change the names as you see fit.

# OAuth Integration

In order for client authentication via Open Id Connect (OIDC) it is important to edit the values in
```.env.development``` for development and local testing, do not commit changes to this file.

Meanwhile, ```.env``` contains the template parameter names and ```.env.production``` should be changed only by CI/CD
pipeline to not commit any secrets. 

## Usages

- ```.env.local``` :
  - Purpose: Developer-specific overrides, regardless of mode.
  - Loaded in all modes: development, production, test, etc.
  - Use for: Secrets or personal tweaks (e.g., API keys, local ports).
  - Should be in .gitignore: Never committed to version control.


- ```.env.development``` :
  - Purpose: Environment-specific configuration for development mode.
  - Loaded when: You run your app in development (e.g., npm run dev or vite --mode development).
  - Use for: Settings that apply to all developers during development.


- ```.env.production``` :
  - Holds production-only values like API endpoints, feature flags, and analytics keys. 
  - Used when you build or run your app in production mode
  

## Load Order (Vite/Webpack)
When loading environment variables, the order is:

| File                     | Purpose                   | Loaded When       | Committed? |
|--------------------------|----------------------------|--------------------|------------|
| `.env`                   | Shared defaults            | Always             | ✅ Yes      |
| `.env.development`       | Dev-specific config        | Dev mode only      | ✅ Yes      |
| `.env.local`             | Personal overrides         | Always             | ❌ No       |
| `.env.development.local` | Personal dev overrides     | Dev mode only      | ❌ No       |

Later files override earlier ones. So .env.development.local overrides .env.development.

## Setting Custom Endpoint and App Title
Edit ``.env.local``, ``.env.development``, or ``.env.production`` and set the variables for endpoint and name

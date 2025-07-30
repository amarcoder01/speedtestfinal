# Deploying SpeedTest Pro to Render

## Deployment Configuration

Based on your project structure, here are the recommended settings for deploying your SpeedTest Pro application to Render:

### Option 1: Using render.yaml (Recommended)

The easiest way to deploy is using the provided `render.yaml` file which configures both the frontend and backend services:

1. Push the `render.yaml` file to your GitHub repository
2. In Render dashboard, select "Blueprint" deployment option
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file and configure the services

### Option 2: Manual Configuration

If you prefer to configure the services manually, use these settings:

#### Frontend Service (Static Site)

- **Root Directory**: `project`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

#### Backend Service (Web Service)

- **Root Directory**: (leave empty - use repository root)
- **Build Command**: `npm install && npm run build:backend`
- **Start Command**: `cd backend && npm start`

## Environment Variables

Make sure to set these environment variables in your Render dashboard:

- `NODE_ENV`: `production`
- `PORT`: `3000` (for backend service)

## Important Notes

1. **Monorepo Support**: Your project is structured as a monorepo with separate frontend and backend. This is fully supported by Render using either the blueprint approach or manual configuration.

2. **API Connection**: Ensure your frontend is configured to connect to the backend service. You'll need to set the appropriate environment variable (e.g., `VITE_API_BASE_URL`) to point to your Render backend service URL.

3. **Health Checks**: The backend service includes a health check endpoint at `/ping` which Render will use to verify the service is running properly.

## Troubleshooting

If you encounter issues during deployment:

1. Check the build logs in the Render dashboard
2. Verify all required environment variables are set
3. Ensure your package.json scripts are correctly defined
4. Check that the backend service is properly exposing the required API endpoints
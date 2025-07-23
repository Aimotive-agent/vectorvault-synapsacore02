# SynapseCore + AIVectorVault Integration

This project integrates SynapseCore AI agent and AIVectorVault vector database into a unified single-page application (SPA) with shared authentication, tabbed navigation, and seamless data flow between components.

## Features

- **Unified SPA**: Built on SynapseCore's React/Vite/Router foundation
- **Tabbed Navigation**: Switch between SynapseCore and AIVectorVault views without page reload
- **Vector Base Selection**: Dropdown in SynapseCore chat UI to select vector bases from AIVectorVault
- **Save to Vault**: Button on AI-generated messages to store content in selected vector base
- **Shared Authentication**: User sessions persist across both SynapseCore and VectorVault views
- **Integrated API**: Backend services for listing vector bases, setting active vault, and adding data to vault

## Project Structure

```
synapsecore/
├── src/
│   ├── components/
│   │   ├── mcp/                  # SynapseCore MCP components
│   │   │   └── AIChat.tsx        # AI chat with vector base integration
│   │   ├── ui/                   # UI components (Shadcn)
│   │   ├── vectorvault/          # AIVectorVault components
│   │   │   ├── contexts/         # Context providers
│   │   │   │   └── AppContext.tsx # VectorVault state management
│   │   │   ├── ChatView.tsx      # VectorVault chat interface
│   │   │   ├── DashboardView.tsx # VectorVault dashboard
│   │   │   ├── DocumentsView.tsx # Document management
│   │   │   ├── SaveToVaultButton.tsx # Save AI messages to vault
│   │   │   ├── ServerView.tsx    # API key management
│   │   │   ├── SettingsView.tsx  # Knowledge base management
│   │   │   ├── Sidebar.tsx       # VectorVault navigation
│   │   │   ├── types.ts          # TypeScript definitions
│   │   │   └── VectorBaseSelector.tsx # KB selector component
│   │   └── Navigation.tsx        # Main app navigation
│   ├── contexts/
│   │   └── AuthContext.tsx       # Unified authentication context
│   ├── hooks/                    # Custom React hooks
│   ├── pages/
│   │   ├── Index.tsx             # Main SynapseCore page
│   │   └── VectorVault.tsx       # VectorVault page
│   ├── services/
│   │   ├── authService.ts        # Authentication service
│   │   └── vectorVaultService.ts # Vector vault API service
│   ├── types/
│   │   └── auth.ts               # Authentication types
│   ├── App.tsx                   # Main application component
│   └── main.tsx                  # Application entry point
├── tests/
│   └── integration.test.js       # Integration tests
└── package.json                  # Dependencies and scripts
```

## Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/Aimotive-agent/vectorvault-synapsacore.git
cd vectorvault-synapsacore
```

2. **Install dependencies**

```bash
cd synapsecore
npm install
```

3. **Run the development server**

```bash
npm run dev
```

4. **Build for production**

```bash
npm run build
```

## Usage Guide

### Authentication

The application uses a unified authentication system. Users must log in to access both SynapseCore and VectorVault features.

### SynapseCore AI Chat

1. Navigate to the AI Chat tab
2. Select a vector base from the dropdown
3. Chat with the AI as usual
4. Use the "Save to Vault" button on AI responses to store them in the selected vector base

### Vector Vault

1. Navigate to the Vector Vault tab
2. Use the sidebar to switch between different views:
   - Dashboard: Overview and statistics
   - Documents: Manage documents in knowledge bases
   - Server: Manage API keys
   - Settings: Create and manage knowledge bases
   - Chat: Chat with your knowledge bases

## Testing

Run the integration tests to verify the functionality:

```bash
npm test
```

## Technical Details

- **Frontend**: React 18.3.1, Vite, React Router, Shadcn UI
- **State Management**: React Context API
- **Storage**: LocalStorage for persistence (in production, would use backend APIs)
- **Authentication**: Token-based authentication with shared session

## Future Enhancements

- Real backend API implementation
- User management and permissions
- Advanced vector search capabilities
- Document processing improvements
- Enhanced AI integration with vector databases
=======
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/064a9b3a-2359-4cb3-8de7-772f5d282c19

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/064a9b3a-2359-4cb3-8de7-772f5d282c19) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/064a9b3a-2359-4cb3-8de7-772f5d282c19) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
>>>>>>> origin/main

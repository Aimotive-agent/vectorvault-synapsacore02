# SynapseCore + AIVectorVault Integration Manual Testing Guide

This document provides step-by-step instructions for manually testing the integration between SynapseCore and AIVectorVault.

## Prerequisites

1. Ensure the application is running locally:
   ```
   npm run dev
   ```

2. Open your browser to the local development server (typically http://localhost:5173)

## Test Cases

### 1. Authentication Flow

#### 1.1 Login Functionality
- [ ] Navigate to `/login`
- [ ] Verify login form displays correctly with email and password fields
- [ ] Try submitting without entering credentials (should show validation errors)
- [ ] Enter invalid credentials and verify error message appears
- [ ] Enter valid credentials (email: `test@example.com`, password: `password`)
- [ ] Verify successful login redirects to home page

#### 1.2 Session Persistence
- [ ] After logging in, refresh the page
- [ ] Verify you remain logged in (not redirected to login)
- [ ] Open a new tab and navigate to the application
- [ ] Verify authentication state persists across tabs

#### 1.3 Logout Functionality
- [ ] Click on logout button/link
- [ ] Verify you are logged out and redirected to login page
- [ ] Try accessing a protected route (should redirect to login)

### 2. Navigation and Routing

#### 2.1 Tabbed Navigation
- [ ] Verify main navigation shows tabs for both SynapseCore and VectorVault
- [ ] Click on SynapseCore tab and verify correct view loads
- [ ] Click on VectorVault tab and verify correct view loads
- [ ] Verify navigation between tabs is smooth without page reload (SPA behavior)

#### 2.2 Protected Routes
- [ ] Log out and try accessing `/vectorvault` directly
- [ ] Verify redirect to login page
- [ ] Log in with a user without `vector_vault_access` permission
- [ ] Try accessing `/vectorvault` and verify redirect to unauthorized page
- [ ] Log in with a user with proper permissions
- [ ] Verify access to both SynapseCore and VectorVault views

### 3. Vector Base Integration

#### 3.1 Vector Base Selection
- [ ] Navigate to SynapseCore chat interface
- [ ] Verify vector base selector dropdown is present
- [ ] Click dropdown and verify it shows available knowledge bases
- [ ] Select a knowledge base and verify selection is reflected in UI
- [ ] Refresh page and verify selected knowledge base persists

#### 3.2 Save to Vault Functionality
- [ ] In SynapseCore chat, interact with the AI to generate a response
- [ ] Verify AI messages have a "Save to Vault" button
- [ ] Click "Save to Vault" button on an AI message
- [ ] Verify success indication (button state change, toast notification, etc.)
- [ ] Navigate to VectorVault documents view
- [ ] Verify the saved message appears in the documents list for the selected knowledge base

### 4. Knowledge Base Management

#### 4.1 Create Knowledge Base
- [ ] Navigate to VectorVault settings
- [ ] Create a new knowledge base with a unique name
- [ ] Verify new knowledge base appears in the list
- [ ] Return to SynapseCore chat
- [ ] Verify new knowledge base appears in the vector base selector

#### 4.2 Upload Documents
- [ ] Navigate to VectorVault documents view
- [ ] Upload a document to a knowledge base
- [ ] Verify document appears in the list with correct processing status
- [ ] Wait for processing to complete
- [ ] Verify document status updates to "Processed"

### 5. Cross-Component Integration

#### 5.1 End-to-End Workflow
- [ ] Log in to the application
- [ ] Navigate to VectorVault and create a new knowledge base
- [ ] Upload a document to the knowledge base
- [ ] Navigate to SynapseCore chat
- [ ] Select the newly created knowledge base
- [ ] Chat with the AI and generate a response
- [ ] Save the AI response to the knowledge base
- [ ] Navigate back to VectorVault documents view
- [ ] Verify the saved AI response appears in the documents list
- [ ] Log out and log back in
- [ ] Verify all created data persists

## Reporting Issues

If you encounter any issues during testing, please document them with the following information:
1. Test case number and description
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)
6. Browser and OS information

Submit issues to the project repository or contact the development team directly.

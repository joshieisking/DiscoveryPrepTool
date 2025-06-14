# Discovery Prep Assistant - Annual Report Analysis Platform

## Overview

Discovery Prep Assistant is a modern web application that transforms annual reports into strategic sales intelligence using AI-powered analysis. The platform helps sales teams prepare for discovery calls by extracting actionable insights from complex financial documents in minutes rather than hours.

## System Architecture

The application follows a full-stack TypeScript architecture with:

- **Frontend**: React 18 with TypeScript, built using Vite
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **AI Integration**: Google Gemini API for document analysis
- **UI Framework**: Shadcn/ui components with Tailwind CSS
- **File Processing**: Multer for file uploads with local storage
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **React Router**: Using Wouter for lightweight client-side routing
- **Component Library**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom Dayforce-inspired color palette
- **State Management**: TanStack Query for API state, React hooks for local state
- **File Upload**: Custom drag-and-drop interface with progress tracking

### Backend Architecture
- **API Layer**: RESTful Express.js endpoints with type-safe request/response handling
- **Document Processing**: Multi-stage AI analysis pipeline with parallel processing support
- **File Storage**: Local file system with configurable upload directory
- **Database Layer**: Drizzle ORM with PostgreSQL for data persistence
- **Error Handling**: Centralized error handling with proper HTTP status codes

### AI Analysis Pipeline
- **Stage 0**: Business overview extraction (company model, revenue streams, metrics)
- **Stage 1**: Financial metrics extraction (revenue, profit/loss, employee count)
- **Stage 2**: HR insights generation (workforce analysis, strategic initiatives)
- **Processing Modes**: Sequential or parallel execution based on feature flags
- **Error Recovery**: Partial success handling with graceful degradation

### Database Schema
- **Users Table**: Basic user authentication (username, password)
- **Uploads Table**: File metadata, processing status, and analysis results storage
- **Relationships**: Simple one-to-many between users and uploads

## Data Flow

1. **File Upload**: Users drag-and-drop or select annual report files (PDF, DOC, DOCX)
2. **Validation**: Client-side file type and size validation (max 50MB)
3. **Storage**: Files stored locally with unique naming convention
4. **Processing**: Multi-stage AI analysis using Google Gemini API
5. **Data Persistence**: Analysis results stored as JSON in database
6. **Visualization**: Results transformed into interactive charts and insights
7. **Export**: Users can export analysis as PNG or PDF reports

## External Dependencies

### Core Dependencies
- **@google/generative-ai**: Google Gemini API integration for document analysis
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations and migrations
- **multer**: File upload handling middleware

### UI Dependencies
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **@tanstack/react-query**: Server state management and caching
- **recharts**: Data visualization library for charts and graphs
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with TypeScript execution via tsx
- **Database**: PostgreSQL 16 with Drizzle migrations
- **File Storage**: Local filesystem with automatic directory creation
- **Hot Reload**: Vite development server with HMR support

### Production Build
- **Frontend**: Vite build with optimized bundle splitting
- **Backend**: esbuild bundling with ES modules format
- **Database**: Drizzle push for schema synchronization
- **Assets**: Static file serving through Express middleware

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16 for complete runtime environment
- **Deployment**: Autoscale deployment target with automatic builds
- **Port Configuration**: Internal port 5000 mapped to external port 80
- **Workflows**: Parallel task execution with health checks

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
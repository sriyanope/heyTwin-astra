# FamLens

## Overview

**FamLens** is an AI-powered photo companion for visually impaired elderly users.

It helps elderly users understand family photos and image messages, especially those sent through WhatsApp, by turning images into spoken, personal, conversational descriptions.

The goal is not just to describe what is in an image. The goal is to help users feel emotionally included in family moments.

## One-Liner

FamLens helps visually impaired elderly users stay connected to family photo conversations by turning images into spoken, personal, and conversational descriptions.

## Problem

Family communication is increasingly visual. Families send photos of birthdays, holidays, meals, children, travel, and daily moments through apps like WhatsApp.

For visually impaired elderly users, this creates a quiet barrier:

- They may receive photos but not fully understand them.
- They may miss emotional context.
- They may depend on someone else to explain the image.
- They may struggle to reply naturally.
- Generic image descriptions are often too plain, technical, or emotionally empty.

## Product Promise

When a visually impaired elderly user receives a family photo, FamLens helps them understand:

- Who may be in the image
- What is happening
- What text appears in the image
- What the emotional context is
- What they can ask next
- How they can reply warmly

## Demo Flow

1. A family member sends a photo through WhatsApp.
2. The elderly user uploads or shares the image into FamLens.
3. FamLens analyses the photo using AI.
4. The app gives a short spoken description first.
5. The user can ask follow-up questions by voice.
6. FamLens reads visible text in the image.
7. FamLens explains emotional context in elder-friendly language.
8. FamLens offers to draft a reply.
9. The user confirms, edits, or copies the reply back to WhatsApp.

## Core Differentiator

The differentiator is not **"AI image description."**

The differentiator is **personal, family-context-aware, elder-friendly image understanding.**

FamLens should feel like:

- A gentle companion, not a technical tool
- A bridge into family conversations
- A voice-first assistant for everyday images
- A trustworthy helper that communicates uncertainty clearly

## Main Features

### MVP

- Image upload or share flow
- Short spoken image summary
- Detailed description option
- OCR text reading
- Voice follow-up Q&A
- Warm reply generation
- Confidence and uncertainty wording
- Accessibility-first UI

### Stretch Features

- Family member labeling
- Relationship-aware descriptions
- WhatsApp share-sheet integration
- Multiple language support
- Caregiver setup mode
- Private family memory vault
- Auto-delete uploaded photos after processing

## Tech Stack

### Frontend

- Framework: Next.js or React
- UI style: Large touch targets, high contrast, voice-first interaction
- Audio: Browser speech synthesis or text-to-speech service
- Input: Image upload, camera, or share simulation for demo

### Backend

- Framework: FastAPI or Express
- AI layer: Agnes AI API
- Storage: Local JSON / SQLite / Supabase for demo
- Optional cache: Local sample data for fallback demo reliability

### AI Capabilities

- Image understanding
- OCR
- Natural language summarisation
- Conversational Q&A
- Reply generation
- Optional person/family context matching

## Important Docs

- `AGENTS.md`: coding-agent instructions and guardrails
- `CLAUDE.md`: source of truth for product direction and AI workflow
- `PRODUCT_BRIEF.md`: problem, users, scope, and positioning
- `HACKATHON_POSITIONING.md`: judging story and Agnes API angle
- `DEMO_FLOW.md`: demo narrative and backup plan
- `ARCHITECTURE.md`: system structure
- `API_CONTRACTS.md`: backend schemas
- `ACCESSIBILITY_PRIVACY.md`: accessibility, privacy, and safety rules
- `ROADMAP.md`: priorities and milestones
- `roles/`: separate role responsibilities

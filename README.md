# Memory Music Player

A browser-based web app that lets you create AI-generated visual memories tied to moments in your music. Upload an MP3, play it, type a prompt at any moment, and generate an AI image. Replay later and watch your images reappear automatically at the right timestamps.

## Quick Start

### Prerequisites

- Node.js 18+
- An OpenAI API key with image generation access

### Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the env file and add your API key:

```bash
cp .env.example .env
```

Edit `.env` and set your `OPENAI_API_KEY`.

3. Run the database migration:

```bash
npm run db:migrate
```

4. Start the dev server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Upload an MP3 file from the home page
2. Click a song to open the player
3. Play the song and type a visual prompt while listening
4. Click "Generate Image for This Moment" to capture the timestamp and create an AI image
5. Your saved moments appear as markers on the timeline
6. On replay, images automatically appear when playback reaches their timestamps

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Prisma** + SQLite for local persistence
- **OpenAI API** for image generation
- Native HTML5 `<audio>` for playback

## Configuration

All settings are in `.env`:

| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key | (required) |
| `OPENAI_IMAGE_MODEL` | Image generation model | `gpt-image-1` |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `UPLOAD_DIR` | Directory for uploaded MP3s | `./uploads` |
| `GENERATED_DIR` | Directory for generated images | `./generated` |
# song-mem

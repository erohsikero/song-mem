# Project Brief: AI Memory Music Player
 
## 1. Product Overview
 
Build a browser-based web application that lets a user:
 
1. upload or select an MP3 file,

2. play that MP3 directly in the browser,

3. type a text prompt while listening,

4. capture the current playback timestamp,

5. generate an AI image from that text prompt using the OpenAI API,

6. save the timestamp, prompt, and generated image as a "memory moment",

7. replay the same MP3 later and automatically show the saved images again when playback reaches the corresponding timestamps.
 
The core concept is that each song becomes a personal visual timeline. Over time, users create a layer of timestamped AI-generated imagery tied to the emotional or imaginative moments they experience while listening.
 
## 2. Important API Constraint
 
The user originally requested:

- API key in `.env`

- `gpt-5`

- `type=image_generation`
 
However, based on the current official OpenAI documentation, image generation is handled through GPT Image models and image generation APIs/tooling, not by using `gpt-5` directly as the image model. OpenAI’s docs recommend GPT Image models such as `gpt-image-1`, `gpt-image-1-mini`, and `gpt-image-1.5` for image generation, while GPT-5 family models are positioned as general-purpose reasoning/coding models. The Responses API overview also describes text/image inputs and text outputs, while the image generation guide points developers to the image generation APIs and tools for creating images. citeturn571082search2turn571082search3turn571082search14turn571082search9
 
Therefore, implement the project as follows:

- use the OpenAI API key stored in `.env`,

- do **not** expose the key in client-side code,

- call OpenAI from the server only,

- use an image generation model supported by the current docs, preferably `gpt-image-1.5` or `gpt-image-1`,

- structure the code so the model name is configurable from environment variables in case it changes later. citeturn571082search0turn571082search2turn571082search9turn571082search8
 
## 3. Product Goals
 
### Primary goal

Create a smooth no-login experience where a single user on a device can annotate a song with timestamped prompts and AI-generated images.
 
### Secondary goals

- Make it feel fast and intuitive.

- Preserve memories locally or in a lightweight local database.

- Support replay so saved images reappear automatically.

- Keep architecture simple enough for an MVP.
 
### Non-goals for v1

- No user accounts

- No multi-user sharing

- No collaboration

- No social feed

- No complex music library management

- No audio waveform editing
 
## 4. Required Constraints
 
- No authentication or login required.

- Use a `.env` file for secrets and configuration.

- Server-side OpenAI calls only.

- MP3 playback happens in the browser via native audio support.

- Persist data so the same song can replay its saved moments later.

- Images must display automatically at the right timestamps during playback.
 
## 5. Suggested Tech Stack
 
Use a minimal, practical stack:
 
- **Framework:** Next.js (App Router)

- **Language:** TypeScript

- **UI:** React + simple CSS modules or Tailwind

- **Database:** SQLite for local persistence during MVP

- **ORM:** Prisma or Drizzle

- **File storage:** local filesystem under a writable project directory for uploaded MP3s and generated images

- **Audio playback:** native HTML5 `<audio>` element

- **Server API:** Next.js route handlers

- **Image generation:** OpenAI official SDK or direct server-side HTTP call
 
Why this stack:

- Next.js keeps frontend and backend together.

- SQLite avoids adding auth, cloud infra, or external DB complexity.

- Local file storage is enough for no-login MVP.

- Native audio is simpler than adding a media library.
 
## 6. Core User Experience
 
### First-time usage

1. User opens the app.

2. User uploads an MP3 file.

3. App stores the file and computes a stable song identifier.

4. User presses play.

5. While listening, user types a visual prompt.

6. User clicks **Generate Image for This Moment**.

7. App captures the current playback time.

8. Server generates an image from the prompt.

9. App saves the prompt, timestamp, and image.

10. The newly generated image appears in the UI and a marker appears on the song timeline.
 
### Replay usage

1. User returns later.

2. User opens the same song.

3. App loads all saved moments for that song.

4. Timeline markers appear.

5. During playback, whenever current time reaches a saved moment, the related image is displayed automatically.
 
## 7. Functional Requirements
 
### 7.1 Song upload and management

- Allow uploading `.mp3` files from local device.

- Store uploaded file on server filesystem.

- Save metadata in database:

  - original filename

  - stored filename/path

  - file size

  - duration

  - checksum/hash for stable identity

  - created timestamp

- Prevent duplicate song records if the exact same file is uploaded again, ideally by checksum.
 
### 7.2 Audio playback page

- Show song title

- Show play/pause controls

- Show seek bar/progress bar

- Show current playback time and total duration

- Show timeline markers for saved moments
 
### 7.3 Prompt capture

- Text input or textarea for user prompt

- Button to capture current song time and generate image

- Button disabled while generation is in progress

- Optional lightweight inline validation:

  - prompt cannot be empty

  - song must be loaded
 
### 7.4 AI image generation

- Server endpoint accepts:

  - song ID

  - timestamp

  - prompt text

- Server calls OpenAI image generation API with configurable model

- Save returned image locally on server

- Create database record linking image to timestamp and prompt

- Return saved record to client
 
### 7.5 Saved moments

Each saved moment must include:

- unique ID

- song ID

- timestamp in seconds or milliseconds

- prompt text

- image path/URL

- created timestamp

- optional generated caption or display label
 
### 7.6 Replay behavior

- Load all saved moments for a song on page load.

- During playback, compare current time to saved moments.

- When playback reaches a saved timestamp, show the associated image.

- Prevent repeated flickering or re-trigger loops by tracking the last displayed moment.
 
### 7.7 Timeline markers

- Render visual markers on the progress bar.

- Marker position = timestamp / duration.

- Clicking a marker seeks playback to that time and shows that moment.
 
### 7.8 Session persistence

Since there is no login:

- persist songs and moments on the server for local app usage,

- optionally store a lightweight recent-song list in browser localStorage for convenience,

- do not build account-level data separation.
 
## 8. Non-Functional Requirements
 
- Simple, clean UI

- Responsive enough for desktop first, acceptable on tablet/mobile

- Graceful error handling for failed uploads or failed image generation

- No API secrets in browser bundle

- Reasonable loading states for generation and upload

- Basic file validation for MP3 uploads
 
## 9. Recommended Application Structure
 
Use something close to this:
 
```text

/app

  /api

    /songs/upload/route.ts

    /songs/[id]/route.ts

    /songs/[id]/moments/route.ts

    /moments/create/route.ts

    /images/[...path]/route.ts (optional if needed)

  /song/[id]/page.tsx

  /page.tsx

/components

  AudioPlayer.tsx

  PromptPanel.tsx

  ImageViewer.tsx

  TimelineMarkers.tsx

  SongList.tsx

/lib

  db.ts

  openai.ts

  audio.ts

  hashing.ts

  storage.ts

/prisma or /drizzle

  schema

/uploads

/generated

```
 
## 10. Database Schema
 
Implement at least these tables.
 
### Song

- `id` string or UUID

- `originalName` string

- `storedPath` string

- `checksum` string unique

- `durationSec` number

- `mimeType` string

- `sizeBytes` number

- `createdAt` datetime
 
### MemoryMoment

- `id` string or UUID

- `songId` foreign key

- `timestampSec` number

- `prompt` text

- `imagePath` string

- `createdAt` datetime
 
Optional later:

- `thumbnailPath`

- `displayOrder`

- `notes`

- `stylePreset`
 
## 11. Detailed Frontend Behavior
 
### Home page

Should include:

- app title

- upload zone or upload button

- list of uploaded songs

- click a song to open its player page
 
### Song page

Should include:

- audio player at top

- timeline with markers

- left or top panel for current song info

- prompt input area

- generate button

- current displayed image

- below that, gallery/list of all saved moments sorted by timestamp
 
### Saved moment card

Each card should show:

- timestamp formatted as `mm:ss`

- prompt text

- thumbnail image

- button to jump to that moment

- optional delete button for later
 
## 12. Time Synchronization Logic
 
This part matters.
 
Implement a robust playback synchronization system.
 
Recommended logic:

- poll or listen on `timeupdate` from the audio element,

- current time should be checked against sorted moments,

- if current time is within a small threshold of a moment timestamp, display that moment,

- keep track of the last shown moment ID to avoid repeated rerenders.
 
Example behavior:

- threshold window: around 0.5 to 1.0 seconds

- if user seeks manually, recalculate which image should currently be displayed

- if user pauses, keep current image visible
 
Pseudo logic:
 
```ts

const threshold = 0.75;
 
function findMomentToDisplay(currentTime: number, moments: MemoryMoment[]) {

  return moments.find((m) => Math.abs(m.timestampSec - currentTime) <= threshold);

}

```
 
Better version:

- sort moments ascending,

- display the most recent moment whose timestamp is less than or equal to current time,

- only change when crossing into a new saved moment.
 
That gives more stable replay behavior.
 
## 13. Image Generation Integration
 
Implement the OpenAI integration behind a dedicated server utility.
 
### Environment variables

Use a `.env` file similar to:
 
```env

OPENAI_API_KEY=your_key_here

OPENAI_IMAGE_MODEL=gpt-image-1.5

DATABASE_URL=file:./dev.db

UPLOAD_DIR=./uploads

GENERATED_DIR=./generated

```
 
### Server requirements

- never expose `OPENAI_API_KEY` to the client,

- all OpenAI calls go through server route handlers,

- save generated image bytes or base64 output to disk,

- store resulting local path in the DB.
 
### Important implementation note

Claude Code should read the latest official OpenAI docs before finalizing the exact request body, because the supported request shape can evolve. The current official docs clearly indicate that image generation is done through GPT Image models and the image generation interface/tools, not by setting GPT-5 as the direct image generation model. citeturn571082search0turn571082search2turn571082search9turn571082search14
 
## 14. API Endpoints to Build
 
### `POST /api/songs/upload`

Uploads MP3 file, extracts metadata, stores song record.
 
Request:

- multipart/form-data with file
 
Response:

- song object
 
### `GET /api/songs`

Return all uploaded songs.
 
### `GET /api/songs/:id`

Return song metadata and associated moments.
 
### `POST /api/moments/create`

Create a new memory moment.
 
Request JSON:

```json

{

  "songId": "song_123",

  "timestampSec": 42.3,

  "prompt": "Dark rainy city with neon reflections"

}

```
 
Response:

```json

{

  "id": "moment_001",

  "songId": "song_123",

  "timestampSec": 42.3,

  "prompt": "Dark rainy city with neon reflections",

  "imagePath": "/generated/moment_001.png",

  "createdAt": "2026-04-15T12:00:00Z"

}

```
 
### Optional later

- `DELETE /api/moments/:id`

- `PATCH /api/moments/:id`
 
## 15. Error Handling Requirements
 
Handle these cases cleanly:

- unsupported file type upload

- corrupted MP3

- OpenAI request failure

- empty prompt

- disk write failure

- missing song ID

- DB write failure
 
Frontend should show friendly inline errors, not raw stack traces.
 
## 16. Security and Safety Requirements
 
Even though this is a local/no-login app, still implement basic safeguards:

- validate upload mime type and extension

- sanitize file names

- never trust client-supplied paths

- restrict uploads to configured directories

- keep secrets server-only

- basic rate limiting can be optional but is not required for local MVP
 
## 17. Design Direction
 
Keep the UI minimal and emotionally expressive.
 
Suggested layout:

- dark or neutral background

- large image display area

- compact audio controls

- prompt box directly below or beside image

- saved moments as small cards under timeline
 
Do not overdesign. Prioritize clarity.
 
## 18. MVP Acceptance Criteria
 
The MVP is complete when all of the following work:
 
1. User can upload an MP3.

2. User can play the MP3 in the browser.

3. User can type a prompt while song is playing.

4. App captures current timestamp when generating.

5. Server generates an AI image from the prompt.

6. App saves prompt, timestamp, and image.

7. Saved moments appear as timeline markers.

8. Reopening the same song loads prior moments.

9. During replay, saved images automatically appear at the correct times.

10. No login is required.

11. API key is stored in `.env` and never exposed client-side.
 
## 19. Phase Breakdown
 
### Sprint 1

Build core skeleton:

- Next.js project setup

- SQLite schema

- MP3 upload and song list

- song detail page

- audio playback

- prompt entry UI

- create saved moments with mocked image placeholders first if needed
 
### Sprint 2

Add full AI flow and replay polish:

- OpenAI image generation integration

- save generated images locally

- timeline markers

- auto-show saved images during playback

- gallery of moments

- error states and loading polish
 
## 20. Implementation Notes for Claude Code
 
Claude Code should:

- generate production-quality TypeScript,

- keep code modular,

- avoid premature abstraction,

- prioritize working end-to-end flow over fancy architecture,

- add clear comments only where logic is non-obvious,

- include setup instructions in README,

- use environment variables for all configurable paths and model settings,

- make the image model swappable by changing `.env`.
 
It should also create:

- a clean README,

- a `.env.example`,

- database migration setup,

- basic seed-free local startup instructions,

- optional sample data instructions.
 
## 21. Final Instruction to Claude Code
 
Build this as a local-first MVP web app. Keep it simple, reliable, and easy to run. The key user delight is this: while listening to a song, the user can capture a feeling at a precise moment, generate an AI image for that moment, and later see those same images return automatically as the song plays again.

 
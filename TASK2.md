Build Phase 2 of the Jarvis Setup Wizard — Skills & Integrations.

## Context
Phase 1 is already built. The project is at ~/Projects/jarvis-wizard.
Run `npx tsc --noEmit` to verify TypeScript is still clean after your changes.
Do NOT break any existing step files.

## What to build in Phase 2:

### 1. Integration setup screens for Canvas LMS (`src/steps/integrations/CanvasSetup.tsx`)
When user selects "Study & Canvas LMS" capability, show a follow-up screen:
- Canvas Base URL (e.g. https://kristiania.instructure.com)
- API Token (password input)
- On submit: validate by calling `GET {baseUrl}/api/v1/users/self` with `Authorization: Bearer {token}`
- On success: show "Connected! Found {N} active courses."
- Store in state.integrations.canvas = { baseUrl, token }

### 2. Integration setup screens for FACEIT (`src/steps/integrations/FaceitSetup.tsx`)
- Input: Nickname
- Validate by calling `GET https://open.faceit.com/data/v4/players?nickname={nickname}` with `Authorization: Bearer {apiKey}`
- But we don't ask for API key from user — FACEIT stats are public with API. Use a hardcoded demo key or skip validation (just store nickname)
- Actually: ask for their FACEIT nickname, store it. Note "API key optional — your stats will be visible"
- Store in state.integrations.faceit = { nickname }

### 3. Integration setup screens for GitHub (`src/steps/integrations/GitHubSetup.tsx`)
- Ask: GitHub username (validate by calling `GET https://api.github.com/users/{username}`)
- On success: show avatar_url, name, public_repos count
- Optional: Personal Access Token (for private repos + notifications) — skip button
- Store in state.integrations.github = { username, token? }

### 4. Integration setup screens for Todoist (`src/steps/integrations/TodoistSetup.tsx`)
- Ask: API token (password input)
- Validate by calling `GET https://api.todoist.com/rest/v2/projects` with `Authorization: Bearer {token}`
- On success: show "Connected! Found {N} projects."
- Store in state.integrations.todoist = { token }

### 5. IntegrationRouter (`src/steps/IntegrationSetup.tsx`)
A router step that:
- Looks at state.capabilities
- Shows integration sub-screens for each capability that needs credentials, one at a time
- Skips capabilities that don't need credentials (web_search, voice_messages, hn_news, etc.)
- When all done, calls onNext()

Order to present them: canvas_lms → github_integration → faceit_cs2 → todoist → done

Show progress: "Integration 1/3: Canvas LMS" etc.

### 6. Update `src/app.tsx`
Insert IntegrationSetup step between Capabilities (step 4) and Installation (step 5):
```
Welcome → UserInfo → Personality → ApiKeys → Capabilities → IntegrationSetup → Installation → Complete
```
Update step numbers in StepHeader for Installation (now "Step 6/8") and Complete (now "Step 7/8").

### 7. Update `src/installers/clawdbot.ts`
Expand `installSelectedSkills` to handle more skills and also add an `installClawdhubSkill` function:
```typescript
export async function installClawdhubSkill(skillName: string, workspacePath: string): Promise<boolean>
```
This should run: `cd {workspacePath}/skills && clawdhub install {skillName}` or fall back to cloning from GitHub if clawdhub fails.

Map these capabilities to skills:
- reminders → remind-me
- hn_news → hn  
- obsidian_notes → obsidian-daily
- canvas_lms → canvas-lms
- youtube_transcripts → youtube-watcher
- japanese_language → japanese-translation-and-tutor

For voice_messages: handled by voice.ts installer, not clawdhub.
For github_integration, faceit_cs2: no skill needed, just TOOLS.md entries.
For web_search: no skill needed (built into Clawdbot).

### 8. Update `src/templates/tools.ts`
Expand `renderToolsTemplate` to generate proper TOOLS.md sections for each configured integration:

- If canvas configured: include Canvas LMS section with base URL and token placeholder note
- If FACEIT configured: include FACEIT section with nickname, player ID note
- If GitHub configured: include GitHub section with username
- If Todoist configured: include Todoist section with API token
- If voice enabled: include Voice Pipeline section noting jarvis-speak/jarvis-listen are in ~/bin

### 9. Add reusable `ValidationStatus` component (`src/components/ValidationStatus.tsx`)
```typescript
type Status = 'idle' | 'validating' | 'success' | 'error';
interface ValidationStatusProps {
  status: Status;
  successMessage?: string;
  errorMessage?: string;
}
```
Shows spinner when validating, green ✓ on success, red ✗ on error.
Use this in all integration setup screens for consistent UX.

## Style/UX requirements
- Each integration screen: show a brief description of what this integration enables
- Show a [s] Skip option at the bottom (Esc or 's' key) if integration is optional
- Use the existing NavHints component for navigation hints
- Keep screens focused — one integration per screen

## Final checks
1. Run `npx tsc --noEmit` — must pass with 0 errors
2. Run `npx tsx src/index.tsx --help` — must exit clean

## When completely finished, run:
clawdbot gateway wake --text "Done: jarvis-wizard Phase 2 complete. Integration screens + skill wiring built." --mode now

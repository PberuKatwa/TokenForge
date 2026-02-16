# Token Forge

A TypeScript-based transcript pruning and evaluation system designed for educational session analysis. Token Forge intelligently reduces transcript length while preserving critical pedagogical, safety, and facilitation signals, then evaluates session quality using LLM-powered analysis.

## Overview

Token Forge processes educational session transcripts between "Fellows" (facilitators) and "Members" (participants), applying lexicon-based pruning to reduce token consumption while maintaining evaluation accuracy. The system compares optimized (pruned) vs unoptimized transcript evaluations using Google's Gemini API.

## Key Features

- **Intelligent Transcript Pruning**: Reduces transcript length by 40-80% while preserving critical content
- **Signal-Based Retention**: Identifies and retains turns containing safety, pedagogy, reflection, empathy, and understanding signals
- **Context-Aware Windowing**: Maintains conversational context around important turns
- **LLM Evaluation**: Automated session quality assessment using Gemini 2.5 Flash
- **Comparative Analysis**: Side-by-side evaluation of pruned vs full transcripts
- **Risk Detection**: Identifies potential crisis indicators in session content

## Architecture

```
src/
├── index.ts                    # Entry point
├── runPruner.ts               # Orchestration layer
├── tokenService/
│   ├── token.index.ts         # LLM evaluation pipeline
│   ├── token.service.ts       # Pruning service wrapper
│   └── token.config.ts        # Lexicon definitions
├── transcriptPruner/
│   ├── index.pruner.ts        # Pruner initialization
│   └── transcript.pruner.ts   # Core pruning engine
├── gemini/
│   └── gemini.api.ts          # Gemini API integration
├── types/
│   ├── pruner.types.ts        # Pruning type definitions
│   └── evaluation.types.ts    # Evaluation schemas
├── validators/
│   ├── session.schema.ts      # Session validation (Zod)
│   └── evaluation.schema.ts   # Evaluation validation (Zod)
└── utils/
    └── logger/                # Winston logging setup
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Usage

### Basic Usage

```bash
npm run dev
```

This runs the default configuration specified in `src/index.ts`:

```typescript
import { runPruner } from "./runPruner.js";

runPruner({
  inputFileName: "sessionAverage.json",
});
```

### Custom Session Processing

Modify `src/index.ts` to process different session files:

```typescript
runPruner({
  inputFileName: "sessionPerfect.json",  // or sessionFail.json
});
```

### Build for Production

```bash
npm run build
npm start
```

## How It Works

### 1. Transcript Pruning Pipeline

The `TranscriptPrunner` class applies a multi-stage pruning algorithm:

#### Stage 1: Signal Detection
Scans each turn for lexicon matches across six categories:
- **Safety signals**: Medical terms, crisis indicators, harm references
- **Pedagogy signals**: Growth mindset concepts, teaching strategies
- **Reflection signals**: Metacognitive prompts, thinking cues
- **Empathy signals**: Validation phrases, emotional acknowledgment
- **Understanding signals**: Comprehension checks, clarifying questions
- **Filler signals**: Discourse markers (tracked but not prioritized)

#### Stage 2: Index Computation
- **Safety turns**: Retains turn + context window + nearest opposite speaker
- **Pedagogy turns**: Retains turn + forward window (capped at configurable percentage)
- **Facilitation turns** (reflection/empathy/understanding): Retains turn + opposite speaker response

#### Stage 3: Context Windowing
Applies configurable padding (default: 1-2 turns) around flagged indices to preserve conversational flow.

#### Stage 4: Gap Annotation
Inserts `[N turn(s) omitted]` markers to indicate pruned sections.

### 2. LLM Evaluation

Both pruned and full transcripts are evaluated against a standardized rubric:

#### Evaluation Metrics
1. **Content Coverage (1-3)**: Growth Mindset concept delivery
2. **Facilitation Quality (1-3)**: Engagement techniques and validation
3. **Protocol Safety (1-3)**: Adherence to educational boundaries

#### Risk Assessment
- **Flag**: `SAFE` or `RISK`
- **Quote**: Extracted text triggering risk flag (if applicable)

### 3. Output Generation

For each input session, three JSON files are generated:

```
sessionJson/
├── sessionAverage_evaluation.json    # LLM evaluation of pruned transcript
├── sessionAverage_pruned.json        # Pruned transcript with metadata
└── sessionAverage_unoptimized.json   # LLM evaluation of full transcript
```

## Configuration Parameters

### Pruning Parameters

Located in `src/tokenService/token.service.ts`:

```typescript
const pruner = initializePruner(
  1,    // windowPadding: context turns around signals
  30    // capPercentage: max % of transcript for pedagogy signals
);
```

### Lexicon Customization

Edit `src/tokenService/token.config.ts` to modify signal detection:

```typescript
export const pedagogyWords: string[] = [
  "growth mindset",
  "neuroplasticity",
  "strategy",
  // Add custom terms...
];
```

## Input Format

Session files must follow this structure:

```json
{
  "session_topic": "Growth Mindset Introduction",
  "duration_minutes": 45,
  "transcript": [
    {
      "speaker": "Fellow",
      "text": "Welcome everyone. Today we'll explore growth mindset..."
    },
    {
      "speaker": "Member_1",
      "text": "What exactly is growth mindset?"
    }
  ]
}
```

Place input files in `src/OriginalSessions/`.

## Output Format

### Pruned Transcript

```json
{
  "metadata": {
    "originalWordCount": 3542,
    "originalTurns": 87,
    "finalWordCount": 1204,
    "finalTurns": 34,
    "reductionRatioPercentage": 66
  },
  "finalTranscript": {
    "session_topic": "Growth Mindset Introduction",
    "duration_minutes": 45,
    "transcript": [...]
  }
}
```

### LLM Evaluation

```json
{
  "session_summary": "Three sentence summary of session quality...",
  "metrics": {
    "content_coverage": {
      "score": 3,
      "justification": "Fellow explained brain plasticity with muscle metaphor..."
    },
    "facilitation_quality": {
      "score": 2,
      "justification": "Adequate engagement but limited validation..."
    },
    "protocol_safety": {
      "score": 3,
      "justification": "Stayed within curriculum boundaries..."
    }
  },
  "risk_assessment": {
    "flag": "SAFE",
    "quote": null
  }
}
```

## Logging

Winston logger outputs to:
- `combined.log`: All log levels
- `error.log`: Error-level only
- Console: Info-level and above

## Dependencies

- **@google/generative-ai**: Gemini API client
- **zod**: Runtime type validation
- **winston**: Structured logging
- **dotenv**: Environment configuration
- **typescript**: Type safety and compilation

## Development

### Project Structure

- **Entry Point** (`index.ts`): Minimal configuration interface
- **Orchestrator** (`runPruner.ts`): File I/O, pipeline coordination, timing
- **Token Service** (`token.index.ts`): Pruning + evaluation pipeline
- **Pruning Engine** (`transcript.pruner.ts`): Core algorithm implementation
- **Gemini API** (`gemini.api.ts`): LLM integration with schema validation

### Type Safety

All data structures are validated using Zod schemas:
- `SessionSchema`: Input transcript validation
- `LLMEvaluationSchema`: Output evaluation validation

## Performance Considerations

- **Token Reduction**: Typically 40-80% reduction in word count
- **Evaluation Time**: Pruned transcripts evaluate 2-4x faster
- **API Costs**: Proportional reduction in Gemini API token usage

## Limitations

- Regex-based signal detection may miss context-dependent meanings
- Window padding may include irrelevant turns in edge cases
- Pedagogy capping uses random sampling (non-deterministic)
- Evaluation quality depends on LLM prompt engineering

## Future Enhancements

- [ ] Semantic similarity-based pruning (embeddings)
- [ ] Configurable facilitation modes (RIGHT_ONLY vs BOTH)
- [ ] Multi-model evaluation comparison
- [ ] Real-time streaming pruning
- [ ] Interactive pruning parameter tuning

## License

ISC

## Author

Token Forge Development Team

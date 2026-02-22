# LLM Router Complexity Estimation Logic

**Service**: `LLMRouter`
**Method**: `_estimateComplexity`
**File**: `domains/vscode-extension/src/services/llm-router.ts`

## Purpose
The `_estimateComplexity` function is a heuristic algorithm designed to classify an LLM request into one of three complexity tiers: **LOW**, **MEDIUM**, or **HIGH**. This classification is used by the `_selectModel` method to choose the most cost-effective model capable of handling the task (e.g., using a cheaper model for "LOW" complexity and a more capable, expensive model for "HIGH" complexity).

## Logic Breakdown

The function calculates a `score` starting at 0 and adds points based on three factors: **Length**, **Intent**, and **Keywords**.

### 1. Manual Override
If the request object already has a `complexity` property set (e.g., manually specified by a specific command), the function returns that value immediately, bypassing the estimation logic.

### 2. Length Analysis (0 to 3 points)
It calculates the total character count of the prompt plus any attached context (like selected code).
*   **> 2000 characters**: Adds **+3 points**. Large contexts usually imply complex analysis or large-scale generation.
*   **> 500 characters**: Adds **+1 point**. Moderate context implies a standard query.
*   **< 500 characters**: Adds **0 points**. Short prompts are treated as simple questions.

### 3. Intent Analysis (+2 points)
It checks the `intent` of the request. Certain operations are inherently more complex than others.
*   **Complex Intents**: `DEBUG`, `REFACTOR`, `OPTIMIZE`, `STRUCTURE`, `TEST`.
*   **Action**: If the intent matches one of these, it adds **+2 points**.
*   *Note: Simpler intents like `ASK` or `EXPLAIN` do not add points here.*

### 4. Keyword Analysis (+1 point per keyword)
It scans the prompt text for specific technical terms that suggest a difficult engineering problem.
*   **Keywords**: `algorithm`, `architecture`, `performance`, `concurrent`, `database`, `security`.
*   **Action**: For every keyword found in the prompt, it adds **+1 point**.

## Final Classification
The total score determines the returned complexity level:

| Score | Complexity | Model Selection (Default Config) |
| :--- | :--- | :--- |
| **4 or higher** | `HIGH` | `openrouterCrew.model.complex` (e.g., Claude 3.5 Sonnet) |
| **2 or 3** | `MEDIUM` | `openrouterCrew.model.default` (e.g., Claude 3.5 Sonnet) |
| **0 or 1** | `LOW` | `openrouterCrew.model.simple` (e.g., Claude 3 Haiku) |

## Examples

1.  **"How do I center a div?"**
    *   Length: < 500 (0 pts)
    *   Intent: ASK (0 pts)
    *   Keywords: None (0 pts)
    *   **Total: 0** -> **LOW** (Uses cheapest model)

2.  **"Refactor this function." (with 600 chars of code)**
    *   Length: > 500 (+1 pt)
    *   Intent: REFACTOR (+2 pts)
    *   Keywords: None (0 pts)
    *   **Total: 3** -> **MEDIUM** (Uses default model)

3.  **"Optimize this database query for performance." (with 2500 chars of code)**
    *   Length: > 2000 (+3 pts)
    *   Intent: OPTIMIZE (+2 pts)
    *   Keywords: "database", "performance" (+2 pts)
    *   **Total: 7** -> **HIGH** (Uses most capable model)
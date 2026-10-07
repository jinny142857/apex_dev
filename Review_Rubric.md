# APEX SchoolLab Peer-Review Rubric

## Purpose

Use this rubric to give practical, constructive feedback on another participant’s MVP. The workshop focuses on reducing teachers’ administrative workload and improving school administration with simple digital tools.

Evaluate the MVP against its stated problem and core features. Consider what the prototype can demonstrate during the workshop; do not expect production-level infrastructure or features beyond its stated scope.

## Rating Scale

Rate each criterion from **1 to 5**.

- **1 — Not yet demonstrated**
- **2 — Emerging**
- **3 — Functional**
- **4 — Strong**
- **5 — Highly effective**

All four ratings are required. The total score ranges from **4 to 20**.

## Evaluation Criteria

### 1. Practical Applicability and Versatility

**Question:** Is the tool relevant to a real school administrative task, and could its approach be adapted to similar tasks or school contexts?

| Score | Descriptor |
|---:|---|
| 1 | The intended user or school task is unclear, and practical use is not demonstrated. |
| 2 | The tool addresses a narrowly defined situation and would need major changes for similar use. |
| 3 | The tool is relevant to one clearly defined administrative task. |
| 4 | The tool could support several similar tasks or contexts with minor adjustments. |
| 5 | The approach is practical and adaptable across multiple school contexts or administrative tasks. |

### 2. Improvement to Administrative Work

**Question:** To what extent does the tool reduce time, repetition, manual effort, confusion, or the risk of missing information?

| Score | Descriptor |
|---:|---|
| 1 | The tool does not improve the task, or it adds work without a clear benefit. |
| 2 | It offers a small or uncertain improvement. |
| 3 | It reduces effort in at least one specific part of the task. |
| 4 | It noticeably reduces repetitive work, time, confusion, or avoidable omissions. |
| 5 | It substantially simplifies the workflow and clearly frees teachers’ time for other work. |

### 3. Ease of Use

**Question:** Can a teacher understand and use the main workflow without extensive instructions?

| Score | Descriptor |
|---:|---|
| 1 | The main actions or navigation are difficult to understand. |
| 2 | The user needs frequent help to complete the main task. |
| 3 | The main task can be completed, but some steps or labels need clarification. |
| 4 | The workflow is clear, and most teachers could use it independently. |
| 5 | The interface is intuitive and lets the user complete the task with little unnecessary effort. |

### 4. Completeness and Reliability

**Question:** Do the MVP’s stated core features work as expected, without errors that prevent the main task?

| Score | Descriptor |
|---:|---|
| 1 | The core feature is missing or does not work. |
| 2 | The core feature works only partially, with major errors or interruptions. |
| 3 | The main workflow works, though minor errors or unfinished parts remain. |
| 4 | The stated core features work reliably, with no major usability-blocking errors. |
| 5 | The key workflow has been tested from start to finish and works consistently as described. |

## Constructive Feedback

After rating, provide:

- **One strength:** What is useful or promising about this MVP?
- **One suggestion:** What practical improvement would make it more useful?

Keep feedback specific, respectful, and focused on the prototype and its intended task.

## Codex Implementation Specification

Use this Markdown file as the source of truth for the peer-review form.

- App project content path: `public/content/peer-review-rubric.md`
- Render four criterion cards. Each card shows the criterion name, evaluation question, and five selectable score buttons (1–5).
- Do not preselect a score. Require one selection for every criterion before submission.
- Include text fields for “One strength” and “One suggestion.”
- Show the total score out of 20 in the reviewer’s confirmation view.
- Store each evaluation with the target MVP ID, evaluator ID, four criterion scores, feedback fields, and timestamps.
- Do not expose reviewer email or other private account data.
- Allow a reviewer to edit their own evaluation. Prevent duplicate evaluations by the same reviewer for the same MVP; update the existing evaluation instead.
- Show the MVP owner an aggregate score by criterion, total average, number of reviews, and written feedback. Do not expose evaluator emails.
- When this Markdown file is edited and the app is redeployed, update the rubric text and rating descriptions without requiring changes to UI code.

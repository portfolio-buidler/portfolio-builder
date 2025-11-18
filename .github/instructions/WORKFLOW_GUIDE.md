# Team Workflow Guide: GitHub Branching & Collaboration

## Introduction

As a team, we want to make sure our work stays organized, clean, and
conflict-free.\
To achieve this, we follow a clear workflow with GitHub that defines how
we create branches, write commits, merge code, and work together during
each sprint.

This guide explains exactly how we will work step by step, so that
everyone knows what to expect, what to do, and how to keep our
repository tidy and professional.

------------------------------------------------------------------------

## The Big Picture

Think of our repository like a tree with three main layers:

1.  **Main (`main`)** -- The trunk. Production-ready code only. Nothing
    goes here directly. Everything must be reviewed, tested, and
    approved before being merged.\
2.  **Development (`dev`)** -- Staging area where features come together
    before reaching production. Stricter than feature branches, less
    strict than main.\
3.  **Feature branches (`feature/<name>`)** -- Smaller branches created
    each sprint. Each feature gets its own branch. Developers (frontend,
    backend, DevOps) working on that feature commit here.

➡️ At the end of the sprint, once everything is tested and reviewed, the
feature branch merges into `dev`, and finally into `main`. Old branches
are deleted after merging.

------------------------------------------------------------------------

## How We Start Each Sprint

1.  **Sprint Kickoff Meeting**

    -   Decide which features to work on.\
    -   Create a feature branch for each feature.\
    -   Optionally, align on naming for developer branches.\
    -   Define logical order of tasks (avoid blocking each other).

2.  **Creating Feature Branches**\
    Format:

        feature/<feature-name>

    Examples:

    -   `feature/login-system`\
    -   `feature/user-dashboard`

------------------------------------------------------------------------

## How Developers Work Day-to-Day

-   Every developer creates their own branch from the feature branch.\

-   Format:

        <role>/<developer-name>/<feature-part>

    Examples:

    -   `frontend/natanel/login-form`\
    -   `backend/daniel/auth-service`\
    -   `devops/maya/github-actions-setup`

-   Each morning: pull the latest changes from the feature branch.\

-   Work in small, testable pieces -- don't code a full feature without
    committing.\

-   Once finished and tested: merge your branch back into the feature
    branch.

➡️ This keeps the feature branch updated, reduces conflicts, and avoids
last-minute big merges.

------------------------------------------------------------------------

## How We Write Commits

We follow **Conventional Commits**:

-   `feat` → A new feature\
-   `fix` → A bug fix\
-   `docs` → Documentation changes\
-   `style` → Code formatting, no logic\
-   `refactor` → Restructure code without changing behavior\
-   `test` → Adding/updating tests\
-   `chore` → Maintenance tasks (deps, configs)\
-   `ci` → CI/CD pipeline changes\
-   `build` → Build system changes

**Examples:**

    feat(auth): add JWT login support
    fix(navbar): resolve overflow issue on mobile
    docs(readme): update setup instructions

------------------------------------------------------------------------

## How We Merge

1.  **Developer branch → Feature branch**
    -   Merge once a small part is done & tested.
2.  **Feature branch → Dev branch**
    -   Happens only after tests pass & code review.
3.  **Dev branch → Main branch**
    -   At sprint end, after QA and final checks.\
    -   Only clean, stable code reaches main.
4.  **After Sprint Cleanup**
    -   Delete old feature branches.\
    -   Keep only `main` and `dev` ready for the next sprint.

------------------------------------------------------------------------

## Best Practices

-   Merge often -- avoid giant merges.\
-   Keep commits small & logical.\
-   Write meaningful commit messages.\
-   Code reviews are **mandatory** before merging into `dev` or `main`.\
-   Don't mix tasks (no bug fix + feature in one commit).\
-   Clean up old branches.

------------------------------------------------------------------------

## Why This Workflow Helps

-   Everyone knows where to put their code.\
-   Fewer conflicts because merges are frequent.\
-   Project history stays clean and easy to understand.\
-   `main` is always production-ready.\
-   Collaboration between backend, frontend, and DevOps flows smoothly.

------------------------------------------------------------------------

📌 With this workflow, our team will stay organized, professional, and
efficient. Each sprint will run more smoothly, and our repository will
remain clean and reliable.

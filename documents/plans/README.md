# Feature Implementation Plans

This directory contains detailed technical plans, roadmaps, and phase-by-phase task lists for major features and architectural migrations in the ZaaZ project.

---

## 📂 Directory Structure

Each significant feature or refactor should have its own subdirectory:

-   `[feature-name]/plan.md`: The high-level architectural overview and reasoning.
-   `[feature-name]/tasks.md`: A granular, checkable list of development phases and items.

---

## 🛠️ Currently Active/Implemented Plans

1.  **[Auth Token Versioning](auth_token_version/auth_token_version_plan.md)**: Session invalidation and global logout system. (Completed ✅)
2.  **[Payment Renewal Support](payment_renewal_support/plan.md)**: Subscriptions support for automatic vs manual payment methods. (Completed ✅)
3.  **[Repository & Testing Migration](repository_and_testing_migration/plan.md)**: Decoupling Service from Model across all 33 modules. (In Progress 🚀)

---

## 📝 Guidelines for creating a Plan

1.  **Objective:** Clearly state what problem the feature solves.
2.  **Strategy:** Outline the chosen technical approach (Stateless vs Stateful, etc.).
3.  **Data Layers:** Detail any changes to Mongoose schemas or Types.
4.  **Task Breakdown:** Organize work into logical phases (e.g., Types, Logic, Middleware, Cleanup).
5.  **Verification:** Define how the feature will be tested (Functional & Edge cases).

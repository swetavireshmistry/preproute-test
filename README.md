# PrepRoute Test Management Panel

A premium, modern administrative dashboard built for creators and moderators to design, edit, track, and publish mock tests and exams on the PrepRoute platform.

---

## 🚀 Key Features

*   **Moderator Dashboard**: Sleek table layout featuring pagination, search-by-name, filtering by subject, difficulty, and status (Draft/Live), plus metrics widgets.
*   **Test Configurator**: Create or edit test metadata including subject, type, difficulty levels, target duration, scoring structures (correct, incorrect, and unattempted marks), and target topics/sub-topics.
*   **Interactive Question Editor**: 
    *   Wysiwyg Rich Text Editor for formatting complex questions.
    *   Dynamic option fields with live radio selection for correct options.
    *   Detailed explanations/solutions input.
    *   **Validation Shield**: Prevents saving or publishing tests that contain incomplete question slots or identical duplicate options. Focuses and redirects you directly to any invalid questions.
*   **Interactive Test View Page**: Read-only detailed overview showing test statistics, topic badges, and a full question list (highlighting the correct option and displaying solution cards).
*   **Preview & Scheduling**: Live test summaries with interactive toggle buttons to publish instantly or schedule for a specific date and time, along with custom availability windows.
*   **Custom Modals**: Replaced native browser alerts with custom glassmorphism modal dialogs for delete confirmations.

---

## 🛠️ Technology Stack

*   **Core Framework**: React 19, TypeScript, Vite
*   **State Management**: Zustand
*   **Form Management**: React Hook Form
*   **Validation**: Zod
*   **Styling**: Tailwind CSS v4, Lucide React (Icons)
*   **Networking**: Axios
*   **Notifications**: React Hot Toast

---

## ⚙️ Environment Configuration

Before running the application, make sure to configure the environment variables:

1. Copy the example environment template file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set the backend API base URL:
   ```env
   VITE_API_BASE_URL=
   ```

*Note: `.env` is ignored by Git, ensuring local configuration options remain secure. `.env.example` is tracked for reference.*

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

### 4. Run the Code Linter
```bash
npm run lint
```

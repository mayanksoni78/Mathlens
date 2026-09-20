# 🔍 MathLens

> **Interactive Linear Algebra & Computer Vision Visualizer**  
> Bridge the gap between abstract mathematical matrices and tangible digital pixels through real-time interactive exploration.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Pedagogical Concept & Core Curriculum](#-pedagogical-concept--core-curriculum)
  - [Learner Modes (Basic vs. Advanced)](#learner-modes-basic-vs-advanced)
  - [Module 1: From Pixels to Matrices (7 Steps)](#module-1-from-pixels-to-matrices)
  - [Curriculum Roadmap](#curriculum-roadmap)
- [Architecture & Scalable Folder Structure](#-architecture--scalable-folder-structure)
  - [Directory Tree](#directory-tree)
  - [Design Rationale & Scalability](#design-rationale--scalability)
- [How to Add New Modules & Experiments](#-how-to-add-new-modules--experiments)
- [Quickstart Guide](#-quickstart-guide)
- [Tech Stack](#-tech-stack)

---

## 💡 Overview

**MathLens** is an educational web application created to make Linear Algebra intuitive by connecting matrix mathematics directly to image processing and computer vision. 

Instead of memorizing matrix formulas in a vacuum, learners interactively edit numbers, multiply by scalars, split RGB channels, and apply transformation matrices while watching the visual outcome update in real-time on an HTML5 canvas grid.

---

## 🎓 Pedagogical Concept & Core Curriculum

### Learner Modes (Basic vs. Advanced)
The application begins by asking the learner for their background level:
- 🌱 **Basic Mode**: Designed for beginners, visual learners, and early students. Emphasizes analogies (e.g., lightbulbs, primary colors), minimal math jargon, and step-by-step visual intuition.
- ⚡ **Advanced Mode**: Designed for college STEM students, engineers, and researchers. Displays formal linear algebra notation, LaTeX formulas ($X' = AX$, $I(x,y) \in [0, 255]$), 3D tensor representations, and deeper algorithmic explanations.

---

### Module 1: From Pixels to Matrices

| Step | Title | Core Concept | Formula / Rule |
| :--- | :--- | :--- | :--- |
| **Step 1** | **Begin with a Small Grayscale Image** | 4×4 and 8×8 pixel grids side-by-side with numerical matrices. Black ($0$), White ($255$), and intermediate shades of gray. | $I(x, y) \in [0, 255]$ |
| **Step 2** | **Change Individual Matrix Elements** | Interactive cell editing via sliders/inputs. Immediate live pixel updates ($0 \to 50 \to 100 \to 150 \to 200 \to 255$). Establishes: *A digital image is a numerical array*. | $A_{i,j} \leftarrow v$ |
| **Step 3** | **Connect Matrix Operations with Image Brightness** | Scalar multiplication of a matrix: $A' = kA$. $k > 1$ brightens, $0 < k < 1$ darkens. Values $> 255$ clip to 255. | $A' = \min(255, \max(0, k \cdot A))$ |
| **Step 4** | **Move from Grayscale to Colour Images** | Single color pixel as a 3-component vector $[R, G, B]$. Independent red, green, and blue sliders ($0-255$) demonstrating pure and composite colors (e.g., Purple $[128, 0, 128]$). | $\vec{p} = [R, G, B]^T$ |
| **Step 5** | **RGB Matrices of a Colour Image** | Extending from 1 pixel to a full image. A color image is 3 matrices of the same size: $R_{matrix}, G_{matrix}, B_{matrix}$. Interactive channel decomposition and recombination. | $\mathcal{I} = (M_R, M_G, M_B)$ |
| **Step 6** | **Apply Scalar Multiplication to Colour Images** | Brightness scaling across all 3 color channels simultaneously: $R'=kR, G'=kG, B'=kB$. Pipeline view: Original $\to$ RGB matrices $\to$ Scalar multiplication $\to$ Modified image. | $C' = \text{clamp}(k \cdot C)$ |
| **Step 7** | **Image Transformations - See What a Matrix Can Do** | Coordinate transformation: changing pixel coordinates transforms the image ($X' = AX$). 2D rotation, scaling, reflection, and shearing demonstrated on recognizable shapes (Arrow, Letter 'A'). | $X' = A X$ |

---

### Curriculum Roadmap

As the project scales, additional modules slot directly into the architecture:
- 🧩 **Module 2: Convolutions & Spatial Filters** (Sobel edge detection, Gaussian blur, Sharpening, Ridge detection kernels).
- 📉 **Module 3: SVD & Image Compression** (Low-rank approximation $A = \sum_{i=1}^k \sigma_i u_i v_i^T$ to compress images while retaining features).
- 👤 **Module 4: Eigenfaces & Principal Component Analysis (PCA)** (Eigenvectors and eigenvalues for facial recognition and dimensionality reduction).
- 📐 **Module 5: Affine & Homogeneous 3D Projections** ($3\times3$ homogeneous coordinates, translation, perspective warping).

---

## 🏗️ Architecture & Scalable Folder Structure

MathLens employs a **Feature-Sliced / Domain-Driven Architecture**. By keeping mathematical algorithms decoupled from UI presentation, the codebase remains 100% testable, modular, and easy to maintain even as hundreds of interactive lessons are added.

### Directory Tree

```text
MathLens/
├── README.md                                  # Root documentation, pedagogical specs & architecture
└── frontend/
    ├── README.md                              # Frontend setup & development guide
    ├── index.html                             # Single Page Application entry HTML
    ├── package.json                           # Dependencies (React 19, Tailwind CSS 4, React Router 7)
    ├── vite.config.js                         # Vite build configuration
    └── src/
        ├── assets/                            # Brand assets, static SVGs, icons
        ├── config/                            # Application-wide configuration & static data
        │   ├── curriculum.js                  # Lesson metadata, objectives, basic/advanced hints
        │   └── presets.js                     # 4x4 & 8x8 matrix presets (arrow, letter A, gradient, colors)
        ├── context/                           # Global React State Providers
        │   ├── UserLevelContext.jsx           # Basic vs. Advanced learner mode state
        │   └── ProgressContext.jsx            # Lesson completion & progress tracking
        ├── core/                              # Framework-Agnostic Mathematical Engine (Pure JS)
        │   ├── math/
        │   │   ├── matrix.js                  # Matrix creation, scalar scaling, clamping, addition
        │   │   └── transforms.js              # 2D coordinate matrix transformations (X' = AX)
        │   └── image/
        │       ├── color.js                   # RGB vector processing, channel splitting & recombination
        │       └── canvasUtils.js             # High-performance crisp pixel canvas rendering
        ├── hooks/                             # Reusable React Custom Hooks
        │   ├── useMatrix.js                   # Interactive 2D matrix state, cell edits & history
        │   └── useDebounce.js                 # Performance optimization for high-frequency sliders
        ├── components/                        # Shared Cross-Cutting UI Components
        │   ├── common/                        # UI Primitives: Button, Slider, Card, Modal, Badge
        │   ├── layout/                        # Layout Shells: Navbar, SplitPane, StepContainer
        │   ├── math/                          # Math UI: MatrixDisplay, FormulaViewer
        │   └── canvas/                        # Canvas Visualizers: PixelCanvas
        ├── modules/                           # Feature-Sliced Learning Modules (Self-Contained)
        │   ├── onboarding/                    # Learner Level Selection Modal (Basic vs Advanced)
        │   │   └── LevelSelectorModal.jsx
        │   └── pixels-to-matrices/            # Primary Module: From Pixels to Matrices
        │       ├── steps/
        │       │   ├── Step1GrayscaleIntro.jsx       # 4×4 & 8×8 black/white/gray matrix
        │       │   ├── Step2ElementEditing.jsx       # Interactive cell slider & live pixel updates
        │       │   ├── Step3ScalarBrightness.jsx     # A' = kA scalar brightness scaling
        │       │   ├── Step4ColorPixelRGB.jsx        # Single 3-channel RGB pixel vector
        │       │   ├── Step5RGBChannelMatrices.jsx   # Decomposition into R, G, B matrices
        │       │   ├── Step6ColorScalarOps.jsx       # R'=kR, G'=kG, B'=kB pipeline view
        │       │   └── Step7Transformations.jsx      # 2D coordinate transformation X' = AX
        │       ├── PixelsToMatricesModule.jsx        # Step orchestrator & stepper navigation
        │       └── index.js                          # Public module interface
        ├── screens/                           # Page-Level Views (Routes)
        │   ├── HomeScreen.jsx                 # Landing page & curriculum overview
        │   ├── ModuleViewScreen.jsx           # Active module runner
        │   ├── SandboxScreen.jsx              # Free-play matrix/image playground
        │   └── NotFoundScreen.jsx             # 404 handler
        ├── App.jsx                            # Root layout, modal layer & router definitions
        ├── main.jsx                           # Application bootstrap with BrowserRouter
        └── index.css                          # Global styles & Tailwind CSS 4 configuration
```

---

### Design Rationale & Scalability

1. **Separation of Math Engine (`src/core/`)**:
   - All matrix operations, clamping functions, channel splits, and 2D transformation formulas live in pure, framework-agnostic JavaScript files.
   - **Benefit**: Zero coupling to React. They can be unit-tested in isolation, reused across multiple components, or migrated to Web Workers / WebAssembly if matrix dimensions grow to high-resolution images.

2. **Feature-Sliced Modules (`src/modules/`)**:
   - Each learning module (e.g., `pixels-to-matrices`, `convolutions`, `svd-compression`) has its own self-contained directory with its internal steps and specific helpers.
   - **Benefit**: Adding a new module doesn't bloat existing folders. Teams can work on separate modules simultaneously without git merge conflicts.

3. **Domain-Specific UI Primitives (`src/components/math/` & `src/components/canvas/`)**:
   - Reusable components like `<MatrixDisplay />`, `<PixelCanvas />`, `<FormulaViewer />`, and `<SplitPane />` allow rapid construction of new interactive lessons with unified styling and behavior.

4. **Curriculum-Driven Configuration (`src/config/curriculum.js`)**:
   - Lesson titles, summaries, learning objectives, basic hints, and advanced formulas are stored in structured JSON-like configuration files.
   - **Benefit**: Easy to localize, audit, or update pedagogical copy without touching component logic.

---

## 🚀 How to Add New Modules & Experiments

Adding a new module is simple and strictly isolated:

1. **Create the module folder**:
   ```text
   src/modules/convolutions/
   ├── steps/
   │   ├── Step1KernelIntro.jsx
   │   └── Step2EdgeDetection.jsx
   ├── ConvolutionsModule.jsx
   └── index.js
   ```
2. **Add math utilities** (if applicable) under `src/core/math/` (e.g., `convolution.js`).
3. **Register the module metadata** in `src/config/curriculum.js`.
4. **Register the route** in `src/App.jsx`.

---

## ⚡ Quickstart Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm or yarn

### Installation & Development

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Linter**: [Oxlint](https://oxc.rs/)
- **Graphics**: HTML5 Canvas with native crisp pixel scaling (`image-rendering: pixelated`)
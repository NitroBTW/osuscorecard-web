Discord - [![Discord](https://github.com/CLorant/readme-social-icons/raw/main/large/colored/discord.svg)](https://discord.com/invite/U3BaaB5a6t)
Youtube - [![Youtube](https://github.com/CLorant/readme-social-icons/raw/main/large/colored/youtube.svg)](https://youtube.com/@nitrobtw)

# osu! Scorecard Web

The website frontend for generating osu! scorecards. Powered by the [osu!scorecard API backend](https://github.com/NitroBTW/osuscorecard-api).

![Example scorecard](/scorecard_example.png)

## Overview

osu!scorecard web is a framework-free frontend tool that allows users to create and customise scorecards for their osu! gameplay. The entire project has been completely rewritten in TypeScript (still based on the vibe-coded first version) and separated from the backend to provide a better development experience and more maintainable codebase. This rewrite and redesign will allow me to iterate on the project a lot better in future, and let me add features, fixes, and changes much easier.

### Key Features

- **Scorecard Generation**: Create custom scorecards with various options
- **API Score Fetching**: Automatically get score details from the API using its ID or URL
- **Overrides**: Override details when the generator gets them wrong, especially useful for what the community considers a full combo but the API doesn't due to it having missed slider ends.
- **Beatmap Details Fetching**: Get beatmap details, making generating scorecards for unranked/offline scores easier.

## Version 2 Improvements

This version is a significant evolution from the original:

- **Frontend/Backend Separation**: The previous monolithic application has been split into dedicated frontend and backend
- **TypeScript Migration**: Full conversion to TypeScript for improved type safety and developer experience
- **Improved Performance**: Better code organization and build optimization

##  Why Rewrite?

The original web version of this project was not where osu!scorecard started. See when I came up with osu!scorecard, I was way more confident in Python than with web development, and so I created my own fully working tool in python. I wanted to share the tool with the community though, and so the legacy website was a "get this python tool working in a website somehow" kind of project that leaned heavily on AI assistance.

Since then, I've spent a lot more time working on my personal website using modern frameworks like Astro, and the well loved type safe language TypeScript, and this project has been rewritten from scratch (with the original web version used only for reference) with a much cleaner structure and focus on maintainability. The frontend and backend are now properly seperated, the codebase is typed, and future work will be completely hand written.

TL;DR
The original version got osu!scorecard out to the community quickly, while this version is built with much more experience and with the intent for future features and improvements.

## Tech Stack

- **Language**: TypeScript
- **Build Tool**: Vite
- **Dependencies**: 
  - `html-to-image` - For generating scorecard images
- **Styling**: Custom CSS with modern design patterns

## Deployment

This project is currently hosted at **https://scorecard.nutbtw.dev**, with plans for a dedicated URL in the future.

### Future Redesign

> **Note**: The website is planned for a complete redesign once published. This document will be updated with details about the new design, UI/UX improvements, and additional features. The current implementation focuses on core functionality while the redesign will enhance the visual appeal and user experience.

## Project Structure

```
osuscorecard-web/
├── src/
│   ├── api.ts          # API communication logic
│   ├── state.ts        # Application state management
│   ├── dom.ts          # DOM manipulation utilities
│   ├── render.ts       # Rendering logic
│   ├── types.ts        # TypeScript type definitions
│   ├── utils.ts        # Utility functions
│   ├── validation.ts   # Input validation
│   ├── styles.css      # Global styles
│   ├── scorecard.css   # Scorecard-specific styles
│   └── main.ts         # Application entry point
├── public/
│   ├── flags/          # Country flag images
│   ├── favicon.png     # Favicon
│   └── gradient.png    # Star Rating Gradients
├── index.html          # Main HTML file
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # This file
```

## Social Media & Community

Connect with me and my community:

- **YouTube**: ![@nitrobtw](https://www.youtube.com/@nitrobtw) - Tutorials, gameplay, and project updates
- **Discord**: [Join the TWIO community](https://discord.com/invite/U3BaaB5a6t) - Get support, share your creations, and chat with other players

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Thanks to the osu! community for feedback and suggestions

## Contact

For questions, suggestions, or contributions, please open an issue or contact me through the social media links above.

---

Made with ❤️ for the osu! community
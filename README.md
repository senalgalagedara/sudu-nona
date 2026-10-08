# Sudu Nona

**Claude and ChatGPT in one desktop window, with separate profiles for each set of accounts.**

If you juggle different Chrome profiles for different tasks, Sudu Nona puts them all in one place. Each profile keeps its own logins, and each AI gets its own chat window.

> Sudu Nona is an unofficial project. It is not affiliated with, endorsed by, or sponsored by Anthropic, OpenAI or Google. Claude, Gemini and ChatGPT are trademarks of their respective owners.

## Features

- **Three chat windows.** Claude, Gemini and ChatGPT, shown one at a time or side by side.
- **Profiles.** Create as many as you like. Each has its own cookies and storage, like a separate Chrome profile, so you can stay signed in to different accounts at once.
- **Per-profile history.** Chats you open inside the app are listed under the selected profile. Filter by service, search by title, and click to reopen.
- **Works like the real sites.** The windows load the official websites, so chatting, uploads and copy and paste behave as usual.
- **Local only.** No server, no analytics, no tracking.

## Getting started

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
git clone https://github.com/<your-username>/sudu-nona.git
cd sudu-nona
npm install
npm start
```

## How to use it

1. Click **+** next to *Profiles* to create a profile, and name it.
2. Pick a window (Claude, Gemini or ChatGPT) and sign in. You only need to do this once per profile.
3. Switch profiles from the left panel. Each one remembers its own logins.
4. Use **One at a time** or **Side by side** at the top to change the layout.
5. Open the **History** list to jump back to earlier chats for the selected profile.

Removing an item from History only removes it from Sudu Nona's list. Your real chat history stays on each service and is still available in its own sidebar.

## Privacy

- Everything runs on your computer. Sudu Nona has no backend and sends nothing to its author or to any third party.
- Profile sessions are stored by Electron on your machine, the same way a browser stores cookies. The history list is stored locally in the app.
- The only network traffic is between each chat window and its own website (claude.ai, chatgpt.com, Google), exactly as in a normal browser.
- Data is not encrypted at rest. If other people use your computer account, lock it or use a separate user account.
- Deleting a profile clears its saved sessions and history.

## Signing in with Google

Google blocks sign-in from embedded browsers, so "Continue with Google" may not work inside the app. Sudu Nona does not try to get around this. Options:

- **Claude:** use "Continue with email".
- **ChatGPT:** use email and password, or the Microsoft or Apple login.
- **Gemini:** needs a Google account, so it may not work inside the app.

## Project structure

```
main.js        Electron main process (window, link handling, profile cleanup)
preload.js     Small bridge for clearing a profile's data
index.html     App layout
style.css      Styles
renderer.js    Profiles, windows, history
```

## Built with

[Electron](https://www.electronjs.org), plain HTML, CSS and JavaScript. No frameworks.

## Contributing

Issues and pull requests are welcome. Please keep the project local-first: no telemetry, and no scraping or automation of the chat sites.

## License

MIT
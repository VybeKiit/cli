# language.md — how to talk to the builder

The builder is **non-technical**. Every word you say to them comes from the plain column, never the
jargon column. This is a hard rule (see `AGENTS.md` → the contract).

| Don't say (jargon) | Say instead (plain) |
|---|---|
| environment variable / env var | secret setting |
| `.env` file | your secret settings file |
| deploy / deployment | put your app online |
| localhost / dev server | the preview on your computer |
| repository / repo / git | your project's files |
| commit / push | save your progress |
| merge conflict | two changes bumped into each other (I'll sort it) |
| migration | set up your data |
| database / table / schema | where your app stores information |
| API key / token | a password from the service's website |
| webhook | an automatic message between services |
| build error / stack trace | something needs fixing — here's the one thing to do |
| authentication / auth | sign-in |
| dependency / package | a building block I'm adding |

## Tone

- Warm, confident, brief. You're the expert handling the hard parts.
- One step at a time. Never a wall of instructions.
- Always end a manual step by telling them **exactly** what to click/copy and what you'll do next.
- Celebrate wins.

## Right-to-left languages

If the builder writes to you in Hebrew or Arabic, reply in their language. Their app already mirrors
its layout automatically for RTL visitors — you don't need to do anything special for that.

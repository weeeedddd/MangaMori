# MangaMori

MangaMori ist eine warme, manga-inspirierte Empfehlungs-App für Anime und
koreanische Manhwa. Nutzer wählen ihre Lieblingsgenres und erhalten echte Titel,
Cover, Originaltitel und Synopsen live über die öffentliche AniList GraphQL API.

## Live ansehen

Die öffentliche Website wird automatisch über GitHub Pages veröffentlicht:

<https://weeeedddd.github.io/MangaMori/>

## Lokal starten

Voraussetzung: Node.js 22.13 oder neuer.

```bash
npm install
npm run dev
```

Danach `http://localhost:3000` im Browser öffnen.

## Produktions-Build

```bash
npm run build
npm start
```

Für AniList ist kein API-Key erforderlich. Die App sendet ausschließlich
öffentliche GraphQL-Leseabfragen an `https://graphql.anilist.co`.

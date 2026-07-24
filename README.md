# MangaMori

MangaMori ist eine warme, manga-inspirierte Empfehlungs-App für Anime und
koreanische Manhwa. Nutzer wählen ihre Lieblingsgenres und erhalten echte Titel,
Cover, Originaltitel und Synopsen live über die öffentliche AniList GraphQL API.

## Entdeckungsmodus

- **Geheimtipps:** AniList-Ergebnisse brauchen mindestens 69/100 Punkte.
  Gleichzeitig begrenzen Popularitätsobergrenzen die Anime- und
  Manhwa-Ergebnisse, damit Mainstream-Titel nicht das Regal dominieren.
- **Zufällige Archivseiten:** Statt immer Seite 1 zu zeigen, wählt MangaMori
  reproduzierbar wechselnde Seiten aus dem hochwertigen Genre-Pool.
- **Mehr laden:** Weitere Batches werden angehängt und gegen bereits sichtbare
  sowie lokal gemerkte Titel dedupliziert.
- **Überrasch mich:** Mischt unabhängig von der Genre-Auswahl gut bewertete Anime
  und koreanische Manhwa aus einem zufälligen Top-500-Fenster.

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

Der statische GitHub-Pages-Build lässt sich separat prüfen:

```bash
npm run build:pages
```

Für AniList ist kein API-Key erforderlich. Die App sendet ausschließlich
öffentliche GraphQL-Leseabfragen an `https://graphql.anilist.co`.

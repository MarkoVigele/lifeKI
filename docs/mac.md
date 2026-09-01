# Mac

Der Ordner bei uns ist `~/Documents/Projekte/lifeKI`. lifeKI hört auf Port **45221**.

Node 22+. Rust und `wasm-bindgen-cli` 0.2.100 nur, wenn wir den Kern neu bauen. Das vorkompilierte WASM liegt unter `src/wasm/pkg/`.

## Finder

Im Ordner doppelklicken. Beim ersten Mal: Rechtsklick → Öffnen, falls Gatekeeper meckert.

| Datei | Wirkung |
| --- | --- |
| `lifeKI starten.command` | Dev-Server auf 45221, Browser auf |
| `lifeKI stoppen.command` | Server auf 45221 beenden |
| `lifeKI updaten.command` | `git pull` + `npm install` |
| `lifeKI neu starten.command` | Stoppen, Update, wieder starten |
| `lifeKI neustarten + update.command` | Stoppen, `git pull` + `npm install`, wieder starten |
| `lifeKI Version Stand.command` | Zweig, Commit, Spielwiesen, Stände |
| `lifeKI Version Stabil.command` | Zurück auf `main` |
| `lifeKI Version Test anlegen.command` | Neue Spielwiese `test/…` |
| `lifeKI Version Test laden.command` | Vorhandene Spielwiese öffnen |
| `lifeKI Version Stand sichern.command` | Foto des aktuellen Codes |
| `lifeKI Version Stand laden.command` | Gesichertes Foto wiederherstellen |

## Terminal

```bash
cd ~/Documents/Projekte/lifeKI
npm install
npm run starten
```

```bash
npm run stoppen
npm run updaten
npm run neustart
npm run neustart-update
npm run version:stand
```

WASM neu bauen: `npm run wasm`.

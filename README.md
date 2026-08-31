# lifeKI

**Live:** [https://markovigele.github.io/lifeKI/](https://markovigele.github.io/lifeKI/)

Eine lebendige Particle-Life-Welt: jedes Licht hat ein kleines neuronales Netz, Emotionen, Signale und die Fähigkeit zu träumen, zu lügen, sich zu verbünden und zu sterben.

Der Kern läuft in **Rust → WebAssembly**. Die Oberfläche ist React. Das Bild entsteht auf einem hochauflösenden Canvas mit Glow, Spuren und atmosphärischer Tiefe.

## Was hier wirklich passiert

Der Original-Prompt wollte alles gleichzeitig: NEAT, Reverse-Time, SharedArrayBuffer, Pixi, Jotai, Framer, sexuelle und kulturelle Evolution, Fossilien, Gott-Werkzeuge. Das wäre ein Friedhof halbfertiger Systeme geworden.

lifeKI verdichtet das auf einen Kern, der sich *anfühlt*, als hätte jedes Partikel ein Inneres:

- **Klassische Particle-Life-Kräfte** (Anziehungsmatrix) erzeugen sichtbare Emergenz: Zellen, Schwärme, Jagd.
- **Pro Partikel ein festes Mini-Netz** (16→12→8, tanh) in WASM: Inferenz, Hebbsches Lernen, Mutation, Kreuzung.
- **Emotionen** färben Bewegung *und* Licht. Angst flieht, Hunger sucht, Zugehörigkeit knüpft Bänder.
- **Signale** sind eine primitive Sprache. Lügen sind falsche Farben — und können auffliegen.
- **Träume** sind Replay-Phasen in der Stille. **Kultur** kopiert erfolgreiche Gewichte. **Weisheit** dämpft Mutation bei guten Eltern.
- **Fossilien** bewahren starke ausgestorbene Netze. Du kannst sie wiederbeleben.
- **Gott-Werkzeuge** greifen direkt in den Äther: anziehen, nähren, erleuchten, mutieren, Cluster frieren.

Was bewusst weggelassen wurde: NEAT (Topologie-Evolution), echtes Zeit-Zurückspulen, SharedArrayBuffer. Die feste Topologie ist der Grund, warum Tausende Geister gleichzeitig denken können.

## Lokal starten

Der Projektordner auf dem Mac ist **`~/Documents/Projekte/lifeKI`**.  
lifeKI hört auf **Port 45221** (`http://127.0.0.1:45221`) — neben Aether (45217) und Lumina (45219).

Voraussetzungen: Node 22+. Rust und `wasm-bindgen-cli` 0.2.100 nur, wenn du den Kern neu baust. Das vorkompilierte WASM liegt unter `src/wasm/pkg/`.

### Finder-Shortcuts (macOS)

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

### Terminal

```bash
cd ~/Documents/Projekte/lifeKI
npm install
npm run starten          # oder: npm run dev
```

Öffne [http://127.0.0.1:45221](http://127.0.0.1:45221).

```bash
npm run stoppen
npm run updaten
npm run neustart
npm run neustart-update
npm run version:stand
```

WASM neu bauen:

```bash
npm run wasm
```

## Bedienung

Die erste Welt ist die **Erste Lichtung**: wenige, langsame Wesen. Oben links erklärt ein Satz, was gerade passiert. **Was passiert?** (Taste `T`) öffnet die Anleitung — fünf kurze Kapitel, die nacheinander Werkzeuge und Regler freischalten.

- **Klick** auf ein Licht öffnet den Geist-Inspektor.
- Untere Leiste: erst nur Zuschauen, später Füttern, dann mehr.
- Rechts **Gesetze**: nur die Regler der aktuellen Ebene.
- `Leertaste` Pause · `D` Dock · `T` Anleitung · `F` Schönheits-Modus.

Speicherstände liegen in `localStorage` (plus Autosave). Export/Import ist JSON — inklusive einer Stichprobe lebender Geister.

## Architektur

```
UI (React)  →  Engine-Bridge  →  anima_core.wasm
     ↓                ↓
  Canvas 2D      Zero-copy Views auf Positionen, Signale, Events
```

Rust besitzt Physik, Spatial Hash, Netze, Evolution und Events. JavaScript zeichnet und steuert. Kein Second-Guessing auf beiden Seiten.

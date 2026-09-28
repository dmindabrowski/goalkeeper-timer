# Timer zmiany bramkarza — PWA

Minimalistyczna aplikacja webowa (PWA) do odmierzania czasu zmiany na bramce podczas gry w piłkę. Instaluje się na iPhone bez App Store ani konta developerskiego.

---

## Szybki start (lokalnie na Macu)

```bash
cd goalkeeper-timer
python3 -m http.server 8000
```

Otwórz w przeglądarce: http://localhost:8000

---

## Instalacja na iPhone (3 opcje)

### Opcja A — Publiczny HTTPS (zalecane, działa offline) ⭐

PWA na iOS wymaga **HTTPS**, żeby zapisać się jako pełnoprawna aplikacja offline. Najprościej:

**1. Wrzuć folder na darmowy hosting statyczny:**

- **Netlify Drop** — wejdź na https://app.netlify.com/drop i przeciągnij folder `goalkeeper-timer/` w okno przeglądarki. Dostajesz adres typu `https://twoja-nazwa.netlify.app` w 30 sekund.
- **Vercel** — `npx vercel` w folderze, potem `Enter × kilka`.
- **GitHub Pages** — wrzuć folder do repo, włącz Pages w ustawieniach.
- **Cloudflare Pages** — połącz z repo, gotowe.

**2. Otwórz adres w Safari na iPhonie** (Chrome nie zadziała — musi być Safari).

**3. Wybierz:** przycisk **Udostępnij** (kwadrat ze strzałką w górę) → **„Do ekranu początkowego"** → **Dodaj**.

Ikona pojawi się na ekranie startowym. Odpalona z ikony aplikacja działa w trybie pełnoekranowym (bez paska Safari), pamięta ustawienia, **działa offline** — bez internetu, bez serwera.

### Opcja B — Tunel HTTPS z Twojego Maca (do testów)

Zamiast hostingu możesz udostępnić lokalny serwer przez tunel HTTPS:

```bash
# terminal 1
python3 -m http.server 8000

# terminal 2 (jednorazowo: brew install cloudflared)
cloudflared tunnel --url http://localhost:8000
```

Dostaniesz adres `https://xyz.trycloudflare.com` — otwórz go w Safari na iPhonie i dodaj do ekranu początkowego. Uwaga: adres wygasa po zamknięciu tunelu.

Alternatywnie: `ngrok http 8000`.

### Opcja C — LAN bez HTTPS (najprościej, ale bez offline)

Jeśli iPhone jest w tej samej sieci WiFi co Mac:

```bash
# sprawdź IP Maca
ipconfig getifaddr en0

# uruchom serwer nasłuchujący na wszystkich interfejsach
python3 -m http.server 8000 --bind 0.0.0.0
```

Na iPhonie w Safari otwórz `http://IP-MACA:8000` (np. `http://192.168.1.15:8000`). Możesz dodać do ekranu początkowego — aplikacja będzie działać jak natywna, ale **tylko gdy Mac jest włączony i w tej samej sieci** (service worker nie zarejestruje się bez HTTPS, więc nie ma offline).

---

## Funkcje

- **Odliczanie w dół** z pierścieniem postępu i dużym cyferblatem
- **Start / Pauza / Reset / Następna zmiana**
- **Konfigurowalny czas zmiany** (min + sek) i presety: 2, 3, 5, 7, 10 min
- **Sygnał dźwiękowy** — sekwencja pipów przed końcem (1–30 s) + finalny ton
- **Auto-restart** kolejnej zmiany po skończeniu odliczania
- **Wibracje** (na iPhone niedostępne — iOS Safari nie obsługuje Vibration API; zostaje dźwięk)
- **Wake Lock** — ekran nie zaśnie w trakcie meczu (iOS 16.4+)
- **Licznik zmian** w sesji
- **Zapamiętywanie ustawień** w `localStorage`
- **Tryb offline** — po instalacji jako PWA działa bez sieci
- **Skróty klawiaturowe** (na desktopie): `Spacja` start/pauza, `R` reset, `N` następna, `F` pełny ekran
- **Motyw jasny/ciemny** — automatycznie wg systemu

---

## Struktura projektu

```
goalkeeper-timer/
├── index.html              # UI + meta-tagi iOS/PWA
├── styles.css              # Motyw i layout
├── app.js                  # Logika timera
├── sw.js                   # Service Worker (offline cache)
├── manifest.webmanifest    # Manifest PWA
├── icon.svg                # Źródłowa ikona (edytowalna)
├── generate-icons.py       # Skrypt do regeneracji PNG
├── icons/
│   ├── apple-touch-icon.png    # 180×180 — dla iOS
│   ├── icon-192.png            # 192×192 — PWA
│   ├── icon-512.png            # 512×512 — PWA
│   └── icon-maskable-512.png   # 512×512 — maskowana
└── README.md
```

---

## Regeneracja ikon (opcjonalnie)

Jeśli zmienisz `icon.svg`:

```bash
pip3 install --user pillow cairosvg
python3 generate-icons.py
```

Jeśli `cairosvg` nie działa (brak `libcairo` na macOS: `brew install cairo`), łatwo podmienić skrypt na wariant "Pillow-only" (rysowanie kształtów bez SVG).

---

## Uwagi techniczne dla iOS

- **PWA na iOS** jest obsługiwane od iOS 11.3, pełnowartościowo od 16.4+ (Web Push, Wake Lock, Badging).
- **Service Worker** rejestruje się tylko przez HTTPS lub `http://localhost` — dlatego dostęp przez LAN IP nie da offline.
- **Dźwięk** wymaga pierwszej interakcji użytkownika (kliknięcie Start) — WebAudio to obsługuje.
- **Nie usypiaj ekranu** — po dodaniu do ekranu początkowego iOS trzyma stronę aktywną, a Wake Lock dodatkowo blokuje wygaszanie w trakcie odliczania.

---

## Jeżeli chcesz "prawdziwą" natywną aplikację (opcjonalnie)

PWA to 99% przypadków — działa jak natywna, kosztuje 0 zł, nie wymaga zatwierdzania. Jeśli mimo to potrzebujesz `.ipa` do App Store / TestFlight:

1. Wymagane: **konto Apple Developer** ($99/rok) + macOS + **Xcode**.
2. Owiń istniejący kod przez **Capacitor**:
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/ios
   npx cap init "Zmiana GK" com.twojanazwa.zmianagk --web-dir=.
   npx cap add ios
   npx cap open ios
   ```
3. W Xcode: Signing & Capabilities → wybierz swój Apple ID → uruchom na podłączonym iPhonie (Product → Run).

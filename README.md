# Vinn Så Mye Som Mulig - Digital Versjon

En digital versjon av strategispillet "Vinn Så Mye Som Mulig" hvor fire grupper konkurrerer gjennom 10 runder ved å velge X eller Y i hver runde.

## Om spillet

"Vinn Så Mye Som Mulig" er et dynamisk strategispill der fire grupper må balansere samarbeid og egoisme for å maksimere sin gevinst. Spillet tester evnen til taktisk tenkning, timing i forhandlinger, og evnen til å forutse motspillerens valg. Deltakerne må veie risiko mot belønning i sanntid, der hvert valg («X» eller «Y») kan føre til felles suksess, katastrofe – eller en blanding av begge.

## Funksjoner

- **Hovedskjerm:** Viser poengtavle, rundetimer og status for alle gruppene
- **Gruppeskjermer:** Hver gruppe får en unik lenke til sin skjerm hvor de kan endre navn og gjøre valg
- **Sanntidsoppdateringer:** Alle endringer vises umiddelbart for alle deltakere
- **Forhandlingsrunder:** Spesielle runder med økte multiplikatorer hvor gruppene kan forhandle
- **Responsivt design:** Fungerer på alle enheter (PC, tablet, mobil)

## Teknologier

- **Frontend:** React med Styled Components
- **Backend:** Node.js med Express
- **Sanntidskommunikasjon:** Socket.io
- **Tilleggsbiblioteker:** UUID, React Router

## Installasjon og oppsett

### Forutsetninger
- Node.js (v14 eller nyere)
- npm eller yarn

### Installasjon

1. Klon prosjektet:
   ```
   git clone <repo-url>
   cd vinn-sa-mye-som-mulig
   ```

2. Installer serveravhengigheter:
   ```
   npm install
   ```

3. Installer klientavhengigheter:
   ```
   cd client
   npm install
   cd ..
   ```

### Kjøre applikasjonen

#### Utviklingsmodus
For å kjøre både server og klient samtidig i utviklingsmodus:

```
npm run dev-full
```

Alternativt kan du kjøre server og klient separat:

```
# For å kjøre serveren
npm run dev

# I en annen terminal, for å kjøre klienten
npm run client
```

#### Produksjonsmodus
For å bygge og kjøre i produksjonsmodus:

```
# Bygg klienten
npm run build-client

# Kjør serveren i produksjonsmodus
npm start
```

## Hvordan spille

1. Start serveren og åpne nettleseren på `http://localhost:3000`
2. På startskjermen, velg "Hovedskjerm" og del denne på en sentral skjerm
3. Del lenker til "Bli med som gruppe" til hver av de fire gruppene
4. Hver gruppe kan endre sitt gruppenavn
5. Klikk på "Start spillet" på hovedskjermen
6. Gjennom 10 runder velger hver gruppe X eller Y innen tidsbegrensningen
7. Poeng beregnes basert på kombinasjonen av valg
8. I runde 5, 8 og 10 er det spesielle forhandlingsrunder med multiplikatorer

## Spillregler

Resultatet av hver runde bestemmes av antall X og Y:

| Valgkombinasjon | Utfall | Gevinst/Tap per gruppe |
|-----------------|--------|------------------------|
| 4X              | Alle taper | -1000 kr |
| 3X, 1Y          | X vinner, Y taper | X: +1000 kr / Y: -3000 kr |
| 2X, 2Y          | X vinner, Y taper | X: +2000 kr / Y: -2000 kr |
| 1X, 3Y          | X vinner, Y taper | X: +3000 kr / Y: -1000 kr |
| 4Y              | Alle vinner | +1000 kr |

Multiplikatorer i spesialrundene (runde 5, 8, 10) øker alle beløpene. 
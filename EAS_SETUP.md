# EAS Update Setup - Quick Guide

## Why EAS Update?
`expo publish` is deprecated. EAS Update is the modern replacement.

## 🚀 Quick Setup (10 minutes)

### 1. Install EAS CLI
```powershell
npm install -g eas-cli
```

### 2. Login
```powershell
eas login
```
Create account at https://expo.dev if needed.

### 3. Configure Project (First Time)
```powershell
cd apps/mobile
eas build:configure
```
This will:
- Create `eas.json` file
- Ask a few questions (just press Enter for defaults)
- Link your project to Expo

### 4. Publish Update
```powershell
eas update --branch production --message "Hackathon demo"
```

### 5. Get Your Link
After publishing:
- Check terminal output for the link
- Or go to https://expo.dev → Your project → Updates
- Link format: `exp://exp.host/@your-username/compass-ai-coach`

---

## 📱 For Judges to Test

**Option A: Direct Link**
```
Download Expo Go app, then open:
exp://exp.host/@your-username/compass-ai-coach
```

**Option B: QR Code**
1. Go to https://expo.dev
2. Open your project
3. Click "Updates" tab
4. Generate QR code
5. Include in Devpost submission

---

## 🔧 Troubleshooting

**Error: "No EAS project found"**
- Run `eas build:configure` first
- Make sure you're in `apps/mobile` directory

**Error: "Not logged in"**
- Run `eas login`
- Check: `eas whoami`

**Can't find link after update**
- Go to https://expo.dev
- Find your project
- Check "Updates" tab

---

## ✅ Checklist

- [ ] EAS CLI installed
- [ ] Logged in (`eas login`)
- [ ] Project configured (`eas build:configure`)
- [ ] Update published (`eas update`)
- [ ] Link tested on phone
- [ ] Link added to Devpost submission

---

## 🎬 Alternative: Demo Video

If EAS Update is too complex, you can:
1. Record a 3-minute demo video
2. Upload to YouTube (unlisted)
3. Use video URL as "Public Project Link" in Devpost
4. Ensure code repo is public (required)

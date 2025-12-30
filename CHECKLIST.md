# ✅ Setup Checklist

> **Internal Use Only**: This checklist is for the development team and authorized testers using the **Project Neuro Prototype Kit**.

## Pre-Flight Checklist

### Hardware Setup
- [ ] Microcontroller board ready
- [ ] 3x EEG sensors/amplifiers connected
- [ ] Electrodes prepared with conductive gel
- [ ] USB cable connected
- [ ] All grounds properly connected

### Software Setup
- [ ] Node.js installed (v14+)
- [ ] Chrome/Edge/Opera browser installed
- [ ] Firmware Flashing Tool installed
- [ ] `npm install` completed successfully
- [ ] No errors in terminal

## Firmware Upload Checklist

- [ ] Open firmware source code
- [ ] Select correct board target
- [ ] Select correct COM port
- [ ] Click Upload button
- [ ] Wait for "Done uploading" message
- [ ] Open Serial Monitor
- [ ] Set baud rate to correct speed
- [ ] Verify output shows: "3-Channel EEG RMS Band Power Started"
- [ ] Verify format: `CH1 D:0.xxx T:0.xxx A:0.xxx B:0.xxx | CH2... | CH3... |`
- [ ] Close Serial Monitor before connecting web app

## Electrode Placement Checklist

### Channel 1 (A0) - Occipital
- [ ] Clean skin on back of head (O1 or O2 position)
- [ ] Apply conductive gel to electrode
- [ ] Place active electrode on O1/O2
- [ ] Place reference on earlobe or mastoid
- [ ] Secure with tape/headband
- [ ] Check impedance < 10kΩ

### Channel 2 (A1) - Parietal
- [ ] Clean skin on top-center of head (Pz position)
- [ ] Apply conductive gel
- [ ] Place active electrode on Pz
- [ ] Place reference on earlobe or mastoid
- [ ] Secure with tape/headband
- [ ] Check impedance < 10kΩ

### Channel 3 (A2) - Frontal
- [ ] Clean skin on forehead (Fp1 or Fp2)
- [ ] Apply conductive gel
- [ ] Place active electrode on Fp1/Fp2
- [ ] Place reference on earlobe or mastoid
- [ ] Secure with tape/headband
- [ ] Check impedance < 10kΩ

## Web App Launch Checklist

- [ ] Open terminal/command prompt
- [ ] Navigate to project folder: `cd "c:\projects\project neuro"`
- [ ] Run `npm start`
- [ ] Wait for "Compiled successfully!" message
- [ ] Browser opens to `http://localhost:3000`
- [ ] Page loads without errors
- [ ] Click "Connect to Arduino" button
- [ ] Select correct COM port from popup
- [ ] Status shows "● Connected"
- [ ] No error messages displayed

## Data Verification Checklist

### Channel Selector
- [ ] See 3 channel buttons (Channel 1, 2, 3)
- [ ] Click Channel 1 button - display updates
- [ ] Click Channel 2 button - display updates
- [ ] Click Channel 3 button - display updates
- [ ] Selected button highlights in green
- [ ] All channels status shows at top

### Frequency Spectrum
- [ ] See 4 colored bars (Delta, Theta, Alpha, Beta)
- [ ] Bars animate and update
- [ ] Percentages shown on top of bars
- [ ] Title shows correct channel number
- [ ] Chart has neon glow effects

### Time Series Chart
- [ ] See 4 colored lines moving left to right
- [ ] Lines are smooth
- [ ] Chart fills from left to right
- [ ] Title shows correct channel number
- [ ] Legend shows all 4 bands

### Dominant Wave Display
- [ ] Shows dominant wave name (Delta/Theta/Alpha/Beta)
- [ ] Shows matching icon (🌙/🧘/😌/🧠)
- [ ] Shows brain state description
- [ ] Shows channel badge (top-right)
- [ ] Shows all 4 band percentages

## Functional Testing Checklist

### Test 1: Alpha Detection (Channel 1)
- [ ] Switch to Channel 1
- [ ] Open eyes - note alpha percentage (should be low ~10-25%)
- [ ] Close eyes and relax for 10 seconds
- [ ] Alpha percentage increases significantly (40-70%)
- [ ] Eyes closed indicator 👁️ appears
- [ ] Green bar (alpha) becomes tallest
- [ ] Dominant wave changes to "Alpha"
- [ ] State shows "Relaxed / Eyes Closed"

### Test 2: Beta Activity (Channel 3)
- [ ] Switch to Channel 3
- [ ] Relax - note beta percentage (should be moderate 30-50%)
- [ ] Do mental math (count backwards from 100 by 7s)
- [ ] Beta percentage increases (50-70%)
- [ ] Pink bar (beta) becomes tallest
- [ ] Dominant wave changes to "Beta"
- [ ] State shows "Alert / Active Thinking"

### Test 3: Channel Independence
- [ ] Close eyes
- [ ] Switch to Channel 1 - should show high alpha
- [ ] Switch to Channel 3 - should show lower alpha
- [ ] Verify each channel has independent data
- [ ] Mini-status bar shows different dominant waves

### Test 4: Time Series
- [ ] Watch time series chart for 30 seconds
- [ ] Lines should move smoothly from right to left
- [ ] Close eyes - alpha line (green) should rise
- [ ] Open eyes - alpha line should fall
- [ ] Beta line (pink) should move opposite to alpha

## Troubleshooting Checklist

If connection fails:
- [ ] Close Arduino Serial Monitor
- [ ] Unplug and replug USB cable
- [ ] Try different USB port
- [ ] Restart Arduino
- [ ] Refresh browser page
- [ ] Try different browser (Chrome/Edge/Opera only)

If no data appears:
- [ ] Check Arduino Serial Monitor shows correct format
- [ ] Verify baud rate is 115200
- [ ] Check browser console (F12) for errors
- [ ] Verify all 3 sensors connected to A0, A1, A2
- [ ] Check electrode skin contact

If alpha doesn't work:
- [ ] Verify using Channel 1 (not 2 or 3)
- [ ] Check electrode is on back of head (O1/O2)
- [ ] Not on forehead - won't work there
- [ ] Add more conductive gel
- [ ] Close eyes for full 10-15 seconds
- [ ] Completely relax, don't think
- [ ] Try darker room

If beta is always dominant:
- [ ] This is normal for Channel 3 (frontal)
- [ ] Switch to Channel 1 for alpha detection
- [ ] Channel 3 shows high beta during waking state
- [ ] This is expected behavior

## Performance Checklist

- [ ] Data updates smoothly (no freezing)
- [ ] Channel switching is instant
- [ ] Charts animate without lag
- [ ] CPU usage reasonable (check Task Manager)
- [ ] No console errors (press F12)
- [ ] Serial data rate steady (128 Hz)

## Documentation Checklist

Files to review:
- [ ] `README.md` - Overview and features
- [ ] `SETUP_GUIDE.md` - Detailed setup instructions
- [ ] `QUICK_REFERENCE.md` - Quick start guide
- [ ] `SERIAL_FORMAT.md` - Technical data format
- [ ] `ARCHITECTURE.md` - System architecture
- [ ] `UPDATE_SUMMARY.md` - What changed
- [ ] `ELECTRODE_PLACEMENT.md` - Electrode positions

## Safety Checklist

- [ ] Understand this is for educational use only
- [ ] Not a medical device
- [ ] Do not use if you have epilepsy (without supervision)
- [ ] Do not place electrodes near eyes
- [ ] Do not use while driving or operating machinery
- [ ] Clean electrodes after each use
- [ ] Store electrodes properly
- [ ] Use only low-voltage (5V max) sensors

## Success Criteria

You're ready to go when:
- [x] All 3 channels show live data
- [x] Channel switching works
- [x] Closing eyes increases alpha on Channel 1
- [x] Mental activity increases beta on Channel 3
- [x] Charts animate smoothly
- [x] No errors in console
- [x] Dominant wave detection works
- [x] Time series shows historical data

## Optional Enhancements

Ideas for future:
- [ ] Add recording/export functionality
- [ ] Add session playback
- [ ] Add more electrode positions
- [ ] Add frequency resolution settings
- [ ] Add color customization
- [ ] Add sound alerts
- [ ] Add CSV export
- [ ] Add comparison between channels
- [ ] Add 4-channel support

---

## Final Check

- [ ] Everything works as expected
- [ ] No errors or warnings
- [ ] Smooth real-time updates
- [ ] Can switch channels easily
- [ ] Alpha detection works (eyes closed)
- [ ] Beta detection works (mental activity)
- [ ] Documentation is clear
- [ ] Ready to use for experiments! 🧠⚡

---

**Last Updated**: December 28, 2025

**Status**: ✅ All systems ready for 3-channel EEG monitoring!

Print this checklist and check off items as you complete setup. Good luck! 🚀

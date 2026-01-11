# Quick Setup Guide - 3-Channel EEG

> **Research Prototype Notice**: This guide is intended for setting up the **Project Neuro Hardware Prototype**. The commercial version of the headband features a unified PCB design and does not require manual wiring.

## Step 1: Hardware Setup

### Materials Needed:
- Microcontroller Development Board
- 3x EEG sensors/amplifiers (Custom or Compatible Modules)
- 6x EEG electrodes (3 active + 3 reference)
- Conductive gel
- USB cable

### Connections:
```
MCU Pin      →  EEG Sensor
─────────────────────────────
Input 1      →  Channel 1 (Occipital - O1/O2)
Input 2      →  Channel 2 (Parietal - Pz)
Input 3      →  Channel 3 (Frontal - Fp1/Fp2)
GND          →  All sensor grounds
```

## Step 2: Electrode Placement

### Recommended 10-20 System Positions:

**Channel 1 - Occipital (Best for Alpha):**
- Active: O1 or O2 (back of head, above neck)
- Reference: Earlobe (A1/A2) or mastoid bone
- Purpose: Detect alpha waves (eyes closed)

**Channel 2 - Parietal (Mixed Activity):**
- Active: Pz (top-center of head)
- Reference: Earlobe or mastoid
- Purpose: General brain activity, meditation

**Channel 3 - Frontal (Beta/Theta):**
- Active: Fp1 or Fp2 (forehead, above eyebrow)
- Reference: Earlobe or mastoid
- Purpose: Active thinking, focus, emotion

### Electrode Application Tips:
1. Clean skin with alcohol wipe
2. Apply small amount of conductive gel to electrode
3. Part hair (if necessary) to reach scalp
4. Press electrode firmly against skin
5. Secure with medical tape or headband
6. Check impedance - should be < 10kΩ

## Step 3: Firmware Upload

1. Open Flashing Tool
2. Load `firmware_source.c`
3. Select your board type (Tools → Board)
4. Select COM port (Tools → Port)
5. Upload code (Ctrl+U or Upload button)
6. Open Serial Monitor (Ctrl+Shift+M) to verify output
7. You should see: "3-Channel EEG RMS Band Power Started"
8. Data format: `CH1 D:0.xxx T:0.xxx A:0.xxx B:0.xxx | CH2... | CH3... |`

## Step 4: Web App Setup

### First Time Setup:
```bash
cd "c:\projects\project neuro"
npm install
npm start
```

### Subsequent Runs:
```bash
npm start
```

Browser will open to `http://localhost:3000`

## Step 5: Connect & Test

1. Click **"Connect to Device"** button
2. Select your Device's COM port from popup
3. Wait for connection (status shows ● Connected)
4. You should see all 3 channels updating

### Testing Each Channel:

**Test Channel 1 (Occipital - Alpha Detection):**
1. Click "Channel 1" button
2. Keep eyes open - note beta/theta levels
3. Close eyes and relax for 10 seconds
4. Alpha should increase significantly (green bar)
5. Eyes closed indicator 👁️ should appear

**Test Channel 2 (Parietal - General Activity):**
1. Click "Channel 2" button
2. Try meditation breathing
3. Observe theta/alpha activity

**Test Channel 3 (Frontal - Beta Activity):**
1. Click "Channel 3" button
2. Do mental math (count backwards from 100 by 7s)
3. Beta should increase (pink bar)
4. Relax and beta should decrease

## Step 6: Interpret Results

### Healthy Patterns:

**Eyes Open (Alert State):**
- Low alpha (< 20%)
- Moderate to high beta (30-50%)
- Some theta (10-30%)
- Low delta (< 10%)

**Eyes Closed (Relaxed):**
- High alpha (40-60%) especially in occipital
- Lower beta (10-30%)
- Some theta (20-30%)
- Low delta (< 10%)

**Deep Relaxation/Meditation:**
- High theta (40-60%)
- Moderate alpha (20-40%)
- Low beta (< 20%)

### Understanding Channel Differences:

- **Occipital (CH1)**: Most sensitive to eyes open/closed
- **Parietal (CH2)**: General relaxation state
- **Frontal (CH3)**: Cognitive load, attention, emotion

## Troubleshooting

### Poor Signal Quality:
- ✅ Add more conductive gel
- ✅ Clean skin better (alcohol wipe)
- ✅ Check electrode-skin contact
- ✅ Reduce muscle tension (relax jaw/forehead)
- ✅ Move away from electrical interference

### Channel Not Working:
- ✅ Check wiring to that input (Input 1/2/3)
- ✅ Verify sensor is powered
- ✅ Test electrode impedance
- ✅ Try different electrode position

### No Alpha When Closing Eyes:
- ✅ Make sure using occipital electrode (O1/O2)
- ✅ Frontal electrodes won't show much alpha
- ✅ Keep eyes closed for 10-15 seconds
- ✅ Relax completely, don't think
- ✅ Try darkening the room

### Data Too Noisy:
- ✅ Ground reference electrode properly
- ✅ Avoid 60Hz power line interference (move away from outlets)
- ✅ Relax muscles (major source of noise)
- ✅ Use shielded cables
- ✅ Ensure good skin contact

## Advanced Tips

### Optimizing Each Channel:

**For Alpha Detection (CH1 - Occipital):**
- Use O1 or O2 position
- Reference to opposite earlobe
- Close eyes in dark room
- Listen to calm music

**For Meditation Monitoring (CH2 - Parietal):**
- Use Pz or P3/P4 position
- Good for theta detection
- Monitor during meditation practice

**For Cognitive Load (CH3 - Frontal):**
- Use Fp1 or Fp2 position
- Beta increases with mental work
- Theta increases with drowsiness

### Multi-Channel Analysis:

Compare channels simultaneously:
- Occipital alpha high + Frontal beta low = Deeply relaxed
- All channels high beta = Stressed/anxious
- Frontal theta high + Occipital alpha low = Drowsy
- All balanced = Alert but calm

## Safety Notes

⚠️ **IMPORTANT:**
- This is for educational/research purposes only
- Not a medical device
- Do not use if you have epilepsy without supervision
- Do not apply electrodes near eyes
- Do not use while driving or operating machinery
- Consult a professional for medical diagnoses

## Resources

- [10-20 System Guide](https://en.wikipedia.org/wiki/10%E2%80%9320_system_(EEG))
- [EEG Band Frequencies](https://en.wikipedia.org/wiki/Electroencephalography)
- [Electrode Impedance Testing](https://www.google.com/search?q=eeg+electrode+impedance)

## Need Help?

Check the main [README.md](README.md) for more detailed information and troubleshooting.

---

**Happy Brain Hacking! 🧠⚡**

Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ducimus, nesciunt delectus reiciendis voluptate sed, accusantium rem, et debitis dolor corrupti incidunt accusamus esse dolorum laboriosam enim nam quas deserunt quibusdam expedita! Cum rem at necessitatibus consectetur esse quam unde, fuga reiciendis libero alias maxime nesciunt enim suscipit. Itaque debitis aliquam quos reprehenderit impedit eos sint sit corporis quas aliquid illum labore voluptatem accusamus non, commodi magnam incidunt excepturi tempore dolor voluptates aperiam? Dolores optio odio exercitationem, fugiat dolore voluptas voluptatum adipisci corrupti, beatae molestiae ex officiis voluptatem dignissimos expedita eos nemo ullam, tempore sit. Perferendis fugit dignissimos tempore autem quisquam facere cupiditate quae vel dolor minus. Quidem aperiam non saepe alias delectus iste quia et quisquam, eaque asperiores voluptas aspernatur molestias error facilis distinctio laudantium, magnam temporibus iure? Neque, adipisci officiis? At culpa, neque suscipit provident sit soluta dolore consectetur vel quo cupiditate ullam voluptatibus perspiciatis? Sint provident quam rerum expedita fuga similique dignissimos soluta aut, reprehenderit neque, ad debitis. Quidem ullam ab numquam minima, reiciendis voluptatem, quia provident eum voluptatibus quo velit libero nisi cum consequuntur eos aspernatur sed fuga cupiditate incidunt! Corrupti nostrum, iusto voluptatibus quia quod perferendis quisquam commodi sapiente id obcaecati qui atque nam harum? Facere reprehenderit optio quis, laboriosam velit iure ut? Itaque ad eaque dolore vitae cum molestias. Ratione, ad! Eos minima, quia perferendis facere magni modi similique error maiores quos ullam accusamus mollitia veritatis doloremque blanditiis ab unde quibusdam fugit tempora quis enim, distinctio odit quae pariatur? Aut dolorum perferendis sed possimus at magnam, dicta ipsum facilis nostrum vitae doloremque consectetur ducimus modi accusantium ullam cupiditate quas, veniam sunt ea a optio! Iure ducimus consectetur delectus quia temporibus labore sint cupiditate soluta commodi officiis, doloribus quas natus consequuntur excepturi beatae distinctio? Rerum et voluptatem nihil molestias odit dolorum officiis eius sequi inventore ad soluta, corporis ipsum enim! Nemo tempore repudiandae ullam officia asperiores labore ut dolor animi repellat nulla, dolore natus minus molestiae porro consectetur, vero facilis cumque aliquam voluptatum. Assumenda nemo aliquid culpa totam odio dicta amet sit et. Possimus, repellendus aperiam iure corrupti earum quidem molestias dolores debitis unde neque vero facilis aliquid, facere sapiente, id velit recusandae? Esse autem debitis exercitationem corrupti eum velit fugiat sint vel, repudiandae accusantium officiis repellendus maiores illo aspernatur culpa tempore eveniet magnam suscipit odio deserunt rem quis perspiciatis nemo dicta. Commodi, quidem vero voluptate unde ipsam consequuntur a esse laudantium. Odio non iusto laborum fugit, culpa nesciunt? Dolor eligendi ad molestiae quisquam quis harum ea illo repellat similique dignissimos, praesentium molestias corporis illum architecto aut magnam, iusto nobis exercitationem, reiciendis incidunt. Corporis nam ipsam eos obcaecati ad itaque quia quisquam libero suscipit. Ipsa sint rerum, nostrum veritatis, magnam tenetur consequatur, sit assumenda reiciendis fugiat delectus laborum soluta? Ipsam eos, dolores tempore sint sit fuga, atque doloribus, temporibus rerum nam similique earum expedita deleniti at consequuntur? Modi corporis illo omnis mollitia iusto unde explicabo rem veniam, quibusdam amet molestias sit dolorem, eligendi accusamus nemo reprehenderit culpa quam, voluptatum inventore recusandae facere in. Sit ducimus minima debitis ratione, ut fugiat distinctio culpa accusamus doloremque cumque quidem in, recusandae maxime quia ad porro totam? Quae explicabo repellendus saepe, molestiae, ad fugit, facere neque earum labore soluta beatae aperiam! Voluptates earum perspiciatis sunt excepturi magnam dignissimos. Quibusdam temporibus autem accusantium aliquid obcaecati necessitatibus et soluta ut ex tenetur accusamus deleniti libero ipsum quos nostrum, debitis animi commodi, aliquam expedita officiis officia inventore? Soluta sapiente rerum dolores nam consectetur quae vero porro possimus iste repudiandae voluptatum, obcaecati non enim blanditiis eos voluptate accusamus maxime neque ipsa, laborum necessitatibus nostrum ut. Provident quas odio cupiditate sunt quibusdam, consectetur id quasi omnis dolorum eius maxime ipsam. Labore enim minima libero, sit perspiciatis ab magnam voluptatum sapiente illo quasi ratione consequuntur! Debitis facilis vitae recusandae esse libero molestias mollitia adipisci laudantium, sed fugiat nemo rem fuga at in, commodi veniam cupiditate. Fugiat ut, quae dolore earum aliquam fuga eaque cumque est quo, optio, autem hic perferendis qui officia eius ipsam aut enim! Ducimus ex quia assumenda fuga aut nostrum itaque hic, vitae, reiciendis ab sapiente magni, eos excepturi perspiciatis quasi quibusdam amet dicta doloribus libero iure consequatur exercitationem earum. Ullam quidem pariatur, deserunt eum eveniet qui facilis, nulla repellendus consequuntur error dolorem, reprehenderit eos dolores. Eligendi, obcaecati. Quaerat, tenetur! Quis sit dolorum sint distinctio incidunt animi officia vero dignissimos voluptatibus veniam nihil qui esse reprehenderit possimus mollitia, iusto nobis. Assumenda voluptate ipsam architecto nemo nihil unde fuga ea libero ut accusantium sunt reiciendis illo cumque repudiandae quas maiores quidem exercitationem adipisci id, ipsum, voluptatibus aut cupiditate dolores. Minima, autem error maiores dignissimos, hic quos odit ex quae quisquam molestiae corporis veritatis eum dolor ab voluptates quaerat doloribus minus est eveniet quis, nihil sequi? Aut odit dolores obcaecati ducimus officia laboriosam fuga autem consequatur quo voluptas! Officia maiores obcaecati nemo dolorem expedita! Eveniet reprehenderit corrupti facere! Assumenda, explicabo. Quasi, nisi fuga iure a, fugit doloremque autem deleniti repellat hic sed libero tenetur? Modi reprehenderit voluptate temporibus nobis vel eum mollitia fugit laudantium sed, quam dignissimos. Provident adipisci perspiciatis deleniti quia dicta, aliquid quae pariatur doloribus asperiores hic blanditiis aperiam nobis earum voluptas. Expedita iure fugiat tempora repudiandae rem ut neque, esse, quisquam eum provident natus quas doloribus cumque ipsam at, necessitatibus excepturi molestiae! Provident amet fugit ducimus sint ab ut libero deleniti consequuntur dolorem, error, debitis mollitia. Maxime odit maiores voluptatem vitae inventore hic ex velit, dolor necessitatibus animi ut sit accusantium? Rerum iure laborum repellat ratione labore reprehenderit exercitationem asperiores dolore minima porro? Possimus a cumque laudantium placeat aliquid qui rem ipsum suscipit pariatur, reprehenderit nesciunt sequi illo incidunt quos facilis, necessitatibus inventore quibusdam hic laborum modi cupiditate voluptate consequuntur unde blanditiis. Incidunt eius numquam nemo exercitationem vitae minima sunt ea, cupiditate ut veniam voluptatem obcaecati repellat rerum, repudiandae eum sit necessitatibus voluptatum, saepe suscipit quaerat autem porro? At rerum alias, molestiae officiis voluptatem vel vitae ad labore quam porro necessitatibus ea iusto magnam, amet sit iste commodi quibusdam placeat nostrum. Temporibus nulla minima, cupiditate quos earum sequi, deleniti rem unde error pariatur recusandae corrupti tenetur nemo quidem maxime obcaecati porro aspernatur. Laboriosam velit tempora quidem fugit. Earum provident fuga voluptate quos, ab ex mollitia voluptas accusantium facilis at sint vero quo iusto maiores ipsum recusandae nihil excepturi nostrum dolores nemo. Excepturi, accusamus ad esse tempore facere deleniti dolor possimus expedita quisquam laboriosam fugiat doloremque ex ipsam fugit ducimus natus est recusandae, adipisci molestias. Maxime corrupti laudantium consectetur quia blanditiis velit perspiciatis, architecto natus repudiandae laboriosam? Et, exercitationem dicta deleniti recusandae error possimus vel veritatis rem sunt doloribus eum dolorum consectetur ipsam, delectus eaque qui voluptas quo totam accusantium similique tempore placeat. Aliquid pariatur porro blanditiis? Qui, possimus delectus molestiae quas eveniet repellat atque laudantium distinctio provident optio nihil cupiditate, aspernatur accusamus. Voluptatum eum nobis provident deserunt eveniet rerum nemo a numquam odit, illo asperiores quae architecto repellat officia optio! Dolore vero placeat illum, quam impedit officia at enim suscipit laboriosam? Pariatur accusamus expedita quas perspiciatis porro hic quis numquam doloribus sapiente deleniti molestias similique officiis, ipsa reprehenderit aliquid ut impedit quod assumenda, aspernatur eveniet perferendis minima aliquam ea. Ipsam, esse impedit fugit non et cum quam officia perspiciatis voluptatum mollitia maxime tempora aut ex quibusdam ullam libero a, eaque quisquam eum vero beatae aperiam tenetur earum. Quos, repellendus! Obcaecati dicta consequatur laudantium vero, quaerat itaque suscipit laborum cupiditate deserunt officiis odit. Nisi eos pariatur totam ea cum enim eius quae voluptate? Minus velit sunt cumque temporibus suscipit, illo vero porro totam libero in corporis accusantium natus neque repellendus nam repellat blanditiis minima earum maiores iste. Neque voluptate, exercitationem ad sint porro magnam inventore? Rerum maiores, dolorum quam aperiam quis architecto, ratione magni autem fuga deleniti reprehenderit doloremque nisi itaque explicabo odit deserunt excepturi debitis culpa consequuntur sapiente amet sed? Rerum sed quisquam similique dolorum cumque distinctio a voluptas quo eveniet adipisci. Est dignissimos repudiandae aliquid at ducimus eaque distinctio quidem omnis, magni assumenda quo ut minima quod, reiciendis, vero nihil tempora odit non delectus commodi. Nobis doloribus aliquid amet perspiciatis dignissimos possimus at minima voluptate eveniet assumenda reprehenderit, unde quisquam ea quis exercitationem eaque maxime excepturi illo fugit laboriosam atque doloremque iusto. Minima distinctio molestiae fugit vel vero sunt ratione suscipit, nobis aliquam repudiandae nulla natus aliquid est earum maiores sed iure quibusdam quod ad voluptate ipsa quos dignissimos odit? Aliquid deleniti laboriosam aliquam quos at expedita obcaecati nisi adipisci earum consectetur sequi ex voluptate architecto soluta, consequuntur nulla distinctio voluptatum quo error atque nemo pariatur. Similique animi et corporis aliquid nam voluptas obcaecati nesciunt asperiores ad architecto. Doloremque porro consequatur dolore harum provident, quisquam molestias quidem earum blanditiis quaerat accusamus quasi nobis dolores, maiores eligendi facilis assumenda dolorem vitae, quibusdam quos! Cum, rerum recusandae error esse voluptatem ab provident a qui accusamus modi dolor suscipit reiciendis molestiae animi cumque odit excepturi optio repellat nobis rem! Voluptas sequi minus architecto voluptatem, eaque sapiente quod blanditiis necessitatibus. Fuga excepturi debitis, magni eaque rerum dolorem qui velit praesentium ratione mollitia non, voluptates animi obcaecati repellat ipsa reprehenderit! At non distinctio consequatur ex natus? Repudiandae accusantium exercitationem autem similique minus dolorem tempora praesentium hic, earum nulla nam laborum eaque quam facilis. Ut, molestias beatae? Libero cumque ipsum optio sit. Nesciunt, architecto? Sapiente temporibus ea consequuntur, quo rem voluptatem ratione iure? Aspernatur doloremque cupiditate obcaecati officiis. Temporibus quos ipsa est minus cum? Facilis nobis quod voluptas harum excepturi in quisquam blanditiis modi adipisci fugit delectus nemo alias necessitatibus dignissimos, autem eaque! Nostrum numquam, obcaecati possimus praesentium corporis sint aperiam dolore perspiciatis atque consequatur qui ipsum, laudantium impedit odio ipsa sit necessitatibus autem error molestiae vero dolorem totam eum tempora! Recusandae qui optio consequatur, sapiente illo animi quod repellat. Laborum, perspiciatis? Maiores reiciendis adipisci deserunt? Ipsa aliquam sit minima quam, debitis repellendus accusantium, odio in deserunt, eligendi incidunt exercitationem tenetur laborum possimus aspernatur voluptates expedita. Deleniti numquam, debitis consequuntur qui expedita quia quae voluptates laboriosam quam cum assumenda ipsa voluptatibus nam esse dolor alias inventore laudantium hic id adipisci vel. Illum, sapiente dolore hic esse placeat earum odit, cum expedita autem eveniet ratione suscipit in a minus dignissimos! Perspiciatis quis voluptate laboriosam doloribus natus placeat sed, rerum maiores praesentium! Harum impedit suscipit quaerat commodi nihil perspiciatis vel hic. Animi vel dicta iure exercitationem temporibus, molestias aliquid sapiente necessitatibus! Illo perspiciatis non, obcaecati, aspernatur, voluptatum ducimus temporibus voluptatem exercitationem voluptas nam fuga. Facere voluptatibus, quam quos fugiat in ipsum voluptates repudiandae nesciunt fugit. Voluptatum velit praesentium voluptate at fugiat esse deserunt voluptates recusandae sunt dolores, similique quos accusantium culpa nostrum soluta facere reprehenderit impedit, distinctio doloribus quam. Inventore cupiditate sequi debitis, quam facilis dolores necessitatibus fuga id esse commodi corporis quia optio quasi quod in suscipit omnis vitae, illo temporibus labore tenetur beatae sint ut? Eos neque expedita voluptate magni laborum qui voluptatibus natus repellendus labore est, distinctio facere magnam delectus deleniti sequi nihil. Voluptas, corporis natus! Accusamus architecto omnis quisquam ea. Accusantium quas reiciendis minus facilis harum libero porro aperiam vel aspernatur itaque, soluta cumque qui doloribus tempora hic. Ipsum provident ea cumque corporis omnis quae, doloremque laudantium! Adipisci dolorum libero quia perferendis fugit tempore consectetur quo dignissimos nulla? Quis molestias aliquam unde consectetur totam itaque est voluptatem ipsa velit quasi magnam maxime assumenda asperiores nam atque vero pariatur suscipit, iusto illum. Voluptatum, corporis? Animi eum aut illum. Maxime sequi facere dolores temporibus ducimus ex? Eos architecto tenetur voluptates odio, omnis ullam nam reiciendis veritatis dignissimos! Laborum similique vero atque libero maiores vel, consectetur temporibus eum officia distinctio placeat debitis fugiat nobis. Molestiae quas necessitatibus rerum ullam possimus aliquam quibusdam, reiciendis fugit vero provident inventore id voluptate tempore nihil ipsum sint perspiciatis dolores tempora temporibus repudiandae praesentium obcaecati minima quo! Commodi animi cum repellat deleniti, quam placeat. Ipsam, at sequi quibusdam aliquam molestias tenetur iste similique id laborum dolorum eligendi, quam aperiam doloribus voluptatum maxime, atque voluptas incidunt totam recusandae optio voluptates explicabo sed consectetur. Deserunt, illum. Quisquam, quidem iusto perspiciatis itaque quod soluta aliquam quasi vel, minus aut deleniti quia sed veritatis dicta labore. Voluptas maiores labore praesentium dolores ex id repellat consequatur architecto error quam aliquid qui harum accusamus cum, beatae eum officia culpa eveniet quas, officiis ipsum ipsam? Necessitatibus sint atque quae, ea deserunt ducimus tempora adipisci temporibus magnam. Minima explicabo ullam ad iste culpa quisquam dolores maiores? Totam iste pariatur ducimus quod ad explicabo corporis nam deserunt impedit obcaecati accusamus quisquam optio ipsam quibusdam, soluta repellat odio sunt hic harum? Quaerat, omnis, dicta alias ipsam, maxime molestias quasi fugiat molestiae magni minus explicabo! Ipsa sunt error nostrum ea omnis perferendis quos cupiditate nesciunt ab sint totam id adipisci reiciendis velit, officia optio beatae enim impedit quam in vel nam necessitatibus blanditiis! Quae, commodi ipsam dolorem dicta cupiditate tempore repellendus similique facilis hic minus voluptas maiores! Pariatur numquam et exercitationem repellat tempore quibusdam. Voluptatibus enim quae voluptate? Velit quod vitae nihil blanditiis cumque saepe. Ex atque asperiores aut illo, doloremque cupiditate dicta quasi deserunt ab fugit ut, ullam expedita similique porro iure quisquam eius recusandae rerum nesciunt odio! Iure, eum ad omnis eos ratione praesentium. Dignissimos ipsa recusandae eveniet adipisci. Ut eius quos quia dolores magni molestiae, voluptate, nostrum commodi cupiditate soluta deleniti numquam nesciunt molestias! In sunt eaque et voluptatibus omnis, laboriosam pariatur eligendi voluptas animi corrupti unde reiciendis modi ipsa sed aperiam, alias labore, repudiandae id natus! Nobis in placeat eius perferendis, ipsum dolor! Accusantium reprehenderit sit eligendi beatae iste temporibus consequuntur fuga iure nisi aliquam! Laudantium doloremque corrupti voluptatem molestias natus.
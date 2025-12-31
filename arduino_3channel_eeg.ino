/*************************************/
#define SAMPLE_RATE 256
#define BAUD_RATE 115200

#define CH1_PIN A0
#define CH2_PIN A1
#define CH3_PIN A2
/*************************************/

unsigned long lastMicros = 0;
long timer = 0;

/************ FILTER STATE STRUCT ************/
struct Biquad {
  float z1 = 0;
  float z2 = 0;
};

struct EEGFilterState {
  Biquad s1, s2, s3, s4;
};

/************ FILTER FUNCTION ************/
float EEGFilter(float input, EEGFilterState &st) {
  float output = input;

  // Section 1
  {
    float x = output - (-0.95391350f * st.s1.z1) - (0.25311356f * st.s1.z2);
    output = 0.00735282f * x + 0.01470564f * st.s1.z1 + 0.00735282f * st.s1.z2;
    st.s1.z2 = st.s1.z1;
    st.s1.z1 = x;
  }

  // Section 2
  {
    float x = output - (-1.20596630f * st.s2.z1) - (0.60558332f * st.s2.z2);
    output = x + 2.0f * st.s2.z1 + st.s2.z2;
    st.s2.z2 = st.s2.z1;
    st.s2.z1 = x;
  }

  // Section 3
  {
    float x = output - (-1.97690645f * st.s3.z1) - (0.97706395f * st.s3.z2);
    output = x - 2.0f * st.s3.z1 + st.s3.z2;
    st.s3.z2 = st.s3.z1;
    st.s3.z1 = x;
  }

  // Section 4
  {
    float x = output - (-1.99071687f * st.s4.z1) - (0.99086813f * st.s4.z2);
    output = x - 2.0f * st.s4.z1 + st.s4.z2;
    st.s4.z2 = st.s4.z1;
    st.s4.z1 = x;
  }

  return output;
}

/************ FILTER STATES ************/
EEGFilterState ch1, ch2, ch3;

/************ SETUP ************/
void setup() {
  Serial.begin(BAUD_RATE);
}

/************ LOOP ************/
void loop() {
  unsigned long now = micros();
  unsigned long interval = now - lastMicros;
  lastMicros = now;
  timer -= interval;

  if (timer <= 0) {
    timer += 1000000L / SAMPLE_RATE;

    float raw1 = analogRead(CH1_PIN);
    float raw2 = analogRead(CH2_PIN);
    float raw3 = analogRead(CH3_PIN);

    float eeg1 = EEGFilter(raw1, ch1);
    float eeg2 = EEGFilter(raw2, ch2);
    float eeg3 = EEGFilter(raw3, ch3);

    // CSV Output
    Serial.print(eeg1); Serial.print(",");
    Serial.print(eeg2); Serial.print(",");
    Serial.println(eeg3);
  }
}


// Beta
float betaY1[NUM_CH]  = {0};
float betaY2[NUM_CH]  = {0};

/************ BAND FILTERS ***************/
float deltaFilter(int ch, float x) {
  deltaY[ch] += 0.01 * (x - deltaY[ch]);
  return deltaY[ch];
}

float thetaFilter(int ch, float x) {
  thetaY1[ch] += 0.03 * (x - thetaY1[ch]);
  thetaY2[ch] += 0.01 * (thetaY1[ch] - thetaY2[ch]);
  return thetaY2[ch];
}

float alphaFilter(int ch, float x) {
  alphaY1[ch] += 0.07 * (x - alphaY1[ch]);
  alphaY2[ch] += 0.03 * (alphaY1[ch] - alphaY2[ch]);
  return alphaY2[ch];
}

float betaFilter(int ch, float x) {
  betaY1[ch] += 0.15 * (x - betaY1[ch]);
  betaY2[ch] += 0.07 * (betaY1[ch] - betaY2[ch]);
  return betaY2[ch];
}

/************ RMS ***********************/
float rms(float prev, float x) {
  return 0.95 * prev + 0.05 * (x * x);
}

/************ RMS STORAGE ***************/
float rmsDelta[NUM_CH] = {0};
float rmsTheta[NUM_CH] = {0};
float rmsAlpha[NUM_CH] = {0};
float rmsBeta [NUM_CH] = {0};

/************ SETUP *********************/
void setup() {
  Serial.begin(115200);
  Serial.println("3-Channel EEG RMS Band Power Started");
}

/************ LOOP **********************/
void loop() {

  if (micros() - lastMicros >= 1000000 / SAMPLE_RATE) {
    lastMicros = micros();

    for (int ch = 0; ch < NUM_CH; ch++) {

      // ---- READ EEG ----
      float raw = analogRead(inputPin[ch]);

      // ---- DC REMOVE ----
      float eeg = dcRemove(ch, raw);

      // ---- FILTERS ----
      float d = deltaFilter(ch, eeg);
      float t = thetaFilter(ch, eeg);
      float a = alphaFilter(ch, eeg);
      float b = betaFilter (ch, eeg);

      // ---- RMS ----
      rmsDelta[ch] = rms(rmsDelta[ch], d);
      rmsTheta[ch] = rms(rmsTheta[ch], t);
      rmsAlpha[ch] = rms(rmsAlpha[ch], a);
      rmsBeta [ch] = rms(rmsBeta [ch], b);

      // ---- NORMALIZE ----
      float total = rmsDelta[ch] + rmsTheta[ch] +
                    rmsAlpha[ch] + rmsBeta[ch] + 0.0001;

      float nD = rmsDelta[ch] / total;
      float nT = rmsTheta[ch] / total;
      float nA = rmsAlpha[ch] / total;
      float nB = rmsBeta [ch] / total;

      // ---- OUTPUT ----
      Serial.print("CH");
      Serial.print(ch + 1);
      Serial.print(" D:");
      Serial.print(nD, 3);
      Serial.print(" T:");
      Serial.print(nT, 3);
      Serial.print(" A:");
      Serial.print(nA, 3);
      Serial.print(" B:");
      Serial.print(nB, 3);
      Serial.print(" | ");
    }

    Serial.println();
  }
}

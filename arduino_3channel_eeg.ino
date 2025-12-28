/*************** CONFIG *****************/
#define NUM_CH      3
#define SAMPLE_RATE 128   // Hz

const int inputPin[NUM_CH] = {A0, A1, A2};
/****************************************/

unsigned long lastMicros = 0;

/************ DC REMOVAL *****************/
float dc[NUM_CH] = {0};

float dcRemove(int ch, float x) {
  dc[ch] = 0.995 * dc[ch] + 0.005 * x;
  return x - dc[ch];
}

/************ BAND FILTER STATES *********/
// Delta
float deltaY[NUM_CH] = {0};

// Theta
float thetaY1[NUM_CH] = {0};
float thetaY2[NUM_CH] = {0};

// Alpha
float alphaY1[NUM_CH] = {0};
float alphaY2[NUM_CH] = {0};

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

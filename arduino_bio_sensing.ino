#define SAMPLE_RATE 256
#define BAUD_RATE 115200

// BioAmp
#define CH0_PIN A0
#define CH1_PIN A1
#define CH2_PIN A2

// Temperature
#define TEMP1 A3
#define TEMP2 A4
#define TEMP3 A5
#define TEMP4 A6
#define TEMP5 A7

// Modes
#define MODE_EEG 0
#define MODE_EMG 1
#define MODE_EOG 2

int chMode[3] = { MODE_EEG, MODE_EEG, MODE_EEG }; // default all EEG
bool gameMode = false;

// ================= EEG FILTER =================
struct Biquad { float z1 = 0, z2 = 0; };
struct EEGFilterState { Biquad s1, s2, s3, s4; };
EEGFilterState eegState[3];

float EEGFilter(float input, EEGFilterState &st) {
  float output = input;
  { float x = output - (-0.95391350f * st.s1.z1) - (0.25311356f * st.s1.z2);
    output = 0.00735282f * x + 0.01470564f * st.s1.z1 + 0.00735282f * st.s1.z2;
    st.s1.z2 = st.s1.z1; st.s1.z1 = x; }
  { float x = output - (-1.20596630f * st.s2.z1) - (0.60558332f * st.s2.z2);
    output = x + 2.0f * st.s2.z1 + st.s2.z2;
    st.s2.z2 = st.s2.z1; st.s2.z1 = x; }
  { float x = output - (-1.97690645f * st.s3.z1) - (0.97706395f * st.s3.z2);
    output = x - 2.0f * st.s3.z1 + st.s3.z2;
    st.s3.z2 = st.s3.z1; st.s3.z1 = x; }
  { float x = output - (-1.99071687f * st.s4.z1) - (0.99086813f * st.s4.z2);
    output = x - 2.0f * st.s4.z1 + st.s4.z2;
    st.s4.z2 = st.s4.z1; st.s4.z1 = x; }
  return output;
}

// ================= EMG FILTER =================
float EMGFilter(float input) {
  float output = input;
  { static float z1, z2;
    float x = output - 0.05159732*z1 - 0.36347401*z2;
    output = 0.01856301*x + 0.03712602*z1 + 0.01856301*z2;
    z2 = z1; z1 = x; }
  { static float z1, z2;
    float x = output - -0.53945795*z1 - 0.39764934*z2;
    output = x - 2*z1 + z2;
    z2 = z1; z1 = x; }
  { static float z1, z2;
    float x = output - 0.47319594*z1 - 0.70744137*z2;
    output = x + 2*z1 + z2;
    z2 = z1; z1 = x; }
  { static float z1, z2;
    float x = output - -1.00211112*z1 - 0.74520226*z2;
    output = x - 2*z1 + z2;
    z2 = z1; z1 = x; }
  return output;
}

// ================= EOG FILTER =================
float EOGFilter(float input) {
  float output = input;
  { static float z1, z2;
    float x = output - 0.02977423*z1 - 0.04296318*z2;
    output = 0.09797471*x + 0.19594942*z1 + 0.09797471*z2;
    z2 = z1; z1 = x; }
  { static float z1, z2;
    float x = output - 0.08383952*z1 - 0.46067709*z2;
    output = x + 2*z1 + z2;
    z2 = z1; z1 = x; }
  { static float z1, z2;
    float x = output - -1.92167271*z1 - 0.92347975*z2;
    output = x - 2*z1 + z2;
    z2 = z1; z1 = x; }
  { static float z1, z2;
    float x = output - -1.96758891*z1 - 0.96933514*z2;
    output = x - 2*z1 + z2;
    z2 = z1; z1 = x; }
  return output;
}

// ================= ROUTER =================
float processChannel(float x, int mode, int ch) {
  if (mode == MODE_EEG) return EEGFilter(x, eegState[ch]);
  if (mode == MODE_EMG) return EMGFilter(x);
  if (mode == MODE_EOG) return EOGFilter(x);
  return x;
}

// ================= COMMANDS =================
void handleCommand(String cmd) {
  cmd.trim();
  if (cmd == "GAME ON") gameMode = true;
  if (cmd == "GAME OFF") gameMode = false;

  if (cmd == "SET CH0 EEG") chMode[0] = MODE_EEG;
  if (cmd == "SET CH0 EMG") chMode[0] = MODE_EMG;
  if (cmd == "SET CH0 EOG") chMode[0] = MODE_EOG;

  if (cmd == "SET CH1 EEG") chMode[1] = MODE_EEG;
  if (cmd == "SET CH1 EMG") chMode[1] = MODE_EMG;
  if (cmd == "SET CH1 EOG") chMode[1] = MODE_EOG;

  if (cmd == "SET CH2 EEG") chMode[2] = MODE_EEG;
  if (cmd == "SET CH2 EMG") chMode[2] = MODE_EMG;
  if (cmd == "SET CH2 EOG") chMode[2] = MODE_EOG;
}

// ================= SETUP =================
void setup() {
  Serial.begin(BAUD_RATE);
}

// ================= LOOP =================
void loop() {
  static unsigned long lastMicros = 0;
  static long timer = 0;

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    handleCommand(cmd);
  }

  unsigned long now = micros();
  unsigned long interval = now - lastMicros;
  lastMicros = now;
  timer -= interval;

  if (timer <= 0) {
    timer += 1000000L / SAMPLE_RATE;

    float raw0 = analogRead(CH0_PIN);
    float raw1 = analogRead(CH1_PIN);
    float raw2 = analogRead(CH2_PIN);

    float sig0 = processChannel(raw0, chMode[0], 0);
    float sig1 = processChannel(raw1, chMode[1], 1);
    float sig2 = processChannel(raw2, chMode[2], 2);

    int t1 = analogRead(TEMP1);
    int t2 = analogRead(TEMP2);
    int t3 = analogRead(TEMP3);
    int t4 = analogRead(TEMP4);
    int t5 = analogRead(TEMP5);

    if (!gameMode) {
      // Normal EEG + Temperature stream
      Serial.print(sig0); Serial.print(",");
      Serial.print(sig1); Serial.print(",");
      Serial.print(sig2); Serial.print(",");
      Serial.print(t1); Serial.print(",");
      Serial.print(t2); Serial.print(",");
      Serial.print(t3); Serial.print(",");
      Serial.print(t4); Serial.print(",");
      Serial.println(t5);
    }
    else {
      // ===== Joystick Logic =====
      bool left  = (abs(sig1) > 120);
      bool right = (abs(sig2) > 120);
      bool turbo = left && right;
      bool fire  = (abs(sig0) > 100);

      Serial.print("J,");
      Serial.print("L:"); Serial.print(left);
      Serial.print(",R:"); Serial.print(right);
      Serial.print(",T:"); Serial.print(turbo);
      Serial.print(",F:"); Serial.println(fire);
    }
  }
}
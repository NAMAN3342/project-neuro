/**
 * Arduino Bio-Signal Sensor Sketch
 * Reads 3 analog bio-signals and 5 temperature sensors (LM35)
 * Sends data to React app via Serial at 115200 baud
 * 
 * Expected format: sig0,sig1,sig2,t1,t2,t3,t4,t5
 */

// Pin definitions
const int SIG_PIN_0 = A0;  // Bio-signal channel 0 (e.g., Fp1, Fp2)
const int SIG_PIN_1 = A1;  // Bio-signal channel 1 (e.g., C3, C4)
const int SIG_PIN_2 = A2;  // Bio-signal channel 2 (e.g., O1, O2)

const int TEMP_PIN_1 = A3;  // Temperature sensor T1 (LM35)
const int TEMP_PIN_2 = A4;  // Temperature sensor T2 (LM35)
const int TEMP_PIN_3 = A5;  // Temperature sensor T3 (LM35)
const int TEMP_PIN_4 = A6;  // Temperature sensor T4 (LM35)
const int TEMP_PIN_5 = A7;  // Temperature sensor T5 (LM35)

// Sampling configuration
const int SAMPLE_RATE_HZ = 125;  // 125 Hz sample rate
const unsigned long SAMPLE_INTERVAL_US = 1000000 / SAMPLE_RATE_HZ;  // 8000 microseconds

unsigned long lastSampleTime = 0;

void setup() {
  // Initialize serial communication at 115200 baud
  Serial.begin(115200);
  
  // Wait for serial port to connect
  while (!Serial) {
    ; // Wait for serial port to initialize
  }
  
  // Configure analog reference (default 5V)
  analogReference(DEFAULT);
  
  Serial.println("Arduino Bio-Sensor Ready!");
  Serial.println("Format: sig0,sig1,sig2,t1,t2,t3,t4,t5");
}

void loop() {
  unsigned long currentTime = micros();
  
  // Sample at the defined rate
  if (currentTime - lastSampleTime >= SAMPLE_INTERVAL_US) {
    lastSampleTime = currentTime;
    
    // Read bio-signal channels (raw ADC values 0-1023)
    int sig0 = analogRead(SIG_PIN_0);
    int sig1 = analogRead(SIG_PIN_1);
    int sig2 = analogRead(SIG_PIN_2);
    
    // Read temperature sensors (raw ADC values 0-1023)
    // LM35: 10mV/°C with 5V reference
    int t1 = analogRead(TEMP_PIN_1);
    int t2 = analogRead(TEMP_PIN_2);
    int t3 = analogRead(TEMP_PIN_3);
    int t4 = analogRead(TEMP_PIN_4);
    int t5 = analogRead(TEMP_PIN_5);
    
    // Send data in CSV format
    Serial.print(sig0); Serial.print(",");
    Serial.print(sig1); Serial.print(",");
    Serial.print(sig2); Serial.print(",");
    Serial.print(t1); Serial.print(",");
    Serial.print(t2); Serial.print(",");
    Serial.print(t3); Serial.print(",");
    Serial.print(t4); Serial.print(",");
    Serial.println(t5);  // println adds \n at the end
  }
}

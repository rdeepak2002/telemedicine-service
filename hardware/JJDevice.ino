#include <bluefruit.h>
#include <Wire.h>
#include "MAX30105.h"

const int ecg_val = A0;
const int lo_plus = 16;
const int lo_minus = 11;

BLEDfu bledfu;
BLEUart bleuart;
MAX30105 particleSensor;

void setup() {
  Serial.begin(115200);
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)){
    Serial.println("MAX30105 was not found. Please check wiring/power. ");
    while (1);
  }
  pinMode(lo_plus, INPUT);
  pinMode(lo_minus, INPUT);
  delay(10);
  particleSensor.setup(); //Configure sensor with default settings
  particleSensor.setPulseAmplitudeRed(0x0A); //Turn Red LED to low to indicate sensor is running
  particleSensor.setPulseAmplitudeGreen(0); //Turn off Green LED
  Bluefruit.begin();
  Bluefruit.setTxPower(4);
  Bluefruit.setName("HorizonHealth");
  bledfu.begin();
  bleuart.begin();
  startAdv();
}

void startAdv(void) {
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();
  Bluefruit.Advertising.addService(bleuart);
  Bluefruit.ScanResponse.addName();
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244);
  Bluefruit.Advertising.setFastTimeout(30);
  Bluefruit.Advertising.start(0);
}

void loop() {
  if((digitalRead(lo_plus) == 1)||digitalRead(lo_minus == 1)){
    Serial.println('!');
  }
  else {
    Serial.println(analogRead(ecg_val));
    //Serial.println(particleSensor.getRed());
    //Serial.println(particleSensor.getIR());
    //bleuart.println(particleSensor.getRed());
    //bleuart.println(particleSensor.getIR());
    bleuart.println(analogRead(ecg_val));
  }
  delay(1);
}

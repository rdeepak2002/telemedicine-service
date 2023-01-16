import socketio
from time import sleep
from adafruit_ble import BLERadio
from adafruit_ble.advertising.standard import ProvideServicesAdvertisement
from adafruit_ble.services.nordic import UARTService
import unicodedata


#Objects for socket and bluetooth
sio = socketio.Client()
ble = BLERadio()


#Variables for socket transmission
transmission_frequency = 10
rate = float(1 / transmission_frequency)
server_url = 'https://telemedicine-service.herokuapp.com'
data_channel = 'device-data'


#Dummy data for spO2, Heart Rate, temperature
spO2 = [97, 98]
heartRate = [76, 77, 78, 79]
temperature = [98.6, 98.7]


#Socket event definitions
@sio.event
def connect():
    print(f'Connected to server at {server_url}')


@sio.event
def disconnect():
    print(f'Disconnected from server at {server_url}')


@sio.event
def connect_error(data):
    print('The connection failed')


sio.connect(server_url)


#Main loop to receive Bluetooth data, and send data to NodeJS server over sockets
while True:
    if not uart_connection:
    print("Trying to connect...")
    for adv in ble.start_scan(ProvideServicesAdvertisement):
        if UARTService in adv.services: 
            uart_connection = ble.connect(adv)
            print("Connected")
            break
    ble.stop_scan()

    if uart_connection and uart_connection.connected:
    uart_service = uart_connection[UARTService]
    while uart_connection.connected:
        raw = uart_service.readline().decode("utf-8")
        raw = raw.replace('\r\n', '')
        raw = raw.replace('t', '')
        if raw == '':
            pass
        else:
            sensor_values = int(raw)
            print(sensor_values)
            sio.emit(data_channel, sensor_values)
            sleep(rate)
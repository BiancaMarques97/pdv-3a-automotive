const SERVICE_UUID = "38eb4a80-c570-11e3-9507-0002a5d5c51b";

const WRITE_UUID = "38eb4a82-c570-11e3-9507-0002a5d5c51b";

export class ZebraBluetoothService {
  private device: any;
  private characteristic: any;

  async connect() {
    const bluetooth = (navigator as any).bluetooth;

    if (!bluetooth) {
      throw new Error("Web Bluetooth não é suportado neste navegador.");
    }

    this.device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID, "device_information", "battery_service"],
    });

    const server = await this.device.gatt.connect();

    const service = await server.getPrimaryService(SERVICE_UUID);

    this.characteristic = await service.getCharacteristic(WRITE_UUID);
  }

  async print(zpl: string) {
    if (!this.characteristic) {
      throw new Error("Impressora não conectada");
    }

    const bytes = new TextEncoder().encode(zpl);

    const CHUNK_SIZE = 180;

    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);

      await this.characteristic.writeValue(chunk);

      // pequena pausa para a impressora processar
      await new Promise((resolve) => setTimeout(resolve, 8));
    }
  }

  disconnect() {
    this.device?.gatt?.disconnect();
  }
}

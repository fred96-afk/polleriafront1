import { Injectable, signal } from '@angular/core';
import Pusher from 'pusher-js';
import { enviroment } from '../../enviroments/enviroments.development';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PusherService {
  private pusher: Pusher;
  private channel: any;
  
  // Observable para notificaciones de nuevos pedidos
  private orderNotificationSource = new Subject<any>();
  orderNotifications$ = this.orderNotificationSource.asObservable();

  constructor() {
    // Activar logging de Pusher para depuración
    Pusher.logToConsole = true;

    // Configuración de Pusher
    this.pusher = new Pusher(enviroment.pusher.key, {
      cluster: enviroment.pusher.cluster,
      forceTLS: true,
      enabledTransports: ['ws', 'wss']
    });

    // Monitorear el estado de la conexión
    this.pusher.connection.bind('state_change', (states: any) => {
      console.log('Pusher Connection State changed:', states);
    });

    this.pusher.connection.bind('error', (err: any) => {
      console.error('Pusher Connection Error:', err);
    });

    // Suscribirse al canal de administración
    this.channel = this.pusher.subscribe('admin-channel');

    // Escuchar eventos de nuevos pedidos
    this.channel.bind('new-order', (data: any) => {
      this.orderNotificationSource.next(data);
    });
  }

  // Método para suscribirse a otros canales o eventos si es necesario
  subscribeToChannel(channelName: string, eventName: string, callback: (data: any) => void) {
    const channel = this.pusher.subscribe(channelName);
    channel.bind(eventName, callback);
    return channel;
  }

  unsubscribe(channelName: string) {
    this.pusher.unsubscribe(channelName);
  }
}

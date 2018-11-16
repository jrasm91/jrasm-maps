import { Injectable } from '@angular/core';

const url = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCuXBJUxihWAoTYcZH6sTW5b8ytSmwlJhY&libraries=drawing&callback=__onGoogleLoaded'

@Injectable({
  providedIn: 'root'
})
export class GoogleLoaderService {
  loadApi: Promise<any>
  constructor() {
    this.loadApi = new Promise((resolve) => {
      window['__onGoogleLoaded'] = (ev) => {
        console.log('google maps loaded')
        resolve(window['google']);
      }
      let node = document.createElement('script');
      node.src = url;
      node.type = 'text/javascript';
      document.getElementsByTagName('head')[0].appendChild(node);
    });
  }
}

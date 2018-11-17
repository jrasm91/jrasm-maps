import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from 'rxjs';
import { MapMarker, MapPosition, MapPolygon } from '../models/maps.model';

@Injectable({
  providedIn: 'root'
})
export class PolygonServiceService {

  mapsRef: AngularFirestoreCollection;

  constructor(
    private db: AngularFirestore) {
    this.mapsRef = this.db.collection('maps');
  }

  save(name: string, polygons: MapPolygon[], markers: MapMarker[], center: MapPosition, zoom: number) {
    const strippedMarkers = markers.map(marker => {
      const strippedMarker = Object.assign({}, marker);
      delete strippedMarker.infowindow;
      delete strippedMarker.googleMarker;
      return strippedMarker;
    });

    console.log(name, polygons, strippedMarkers, center, zoom);

    this.mapsRef.doc(name).set({ name, polygons, markers: strippedMarkers, center, zoom })
  }

  search(name: string): Observable<any> {
    console.log('searching map by name', name);
    return new Observable(observer => {
      this.mapsRef.doc(name).ref.get().then(doc => {
        if (doc.exists) {
          observer.next(doc.data());
        } else {
          observer.error('No map found with name: ' + name);
        }
      }).catch(function (error) {
        console.log("Error getting document:", error);
        observer.error(error);
      });
    });
  }
}

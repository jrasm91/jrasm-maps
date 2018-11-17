import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GoogleLoaderService } from './services/google-loader.service';
import { PolygonServiceService } from './services/polygon-service.service';
import { MapMarker, MapPolygon } from './models/maps.model';

export enum Mode {
  ADJUSTING = 'ADJUSTING',
  VIEWING = 'VIEWING',
  DRAWING = 'DRAWING'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'jrasm-maps';
  ADJUSTING: boolean = false;
  searchValue = '';
  mode: Mode = Mode.VIEWING;
  fillOpacity = 0.25;

  private google: any;
  private map: any;
  private drawingManager: any;

  private markers: MapMarker[] = [];
  polygons: MapPolygon[] = [];

  constructor(
    private googleMapsLoader: GoogleLoaderService,
    private api: PolygonServiceService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params && params.map) {
        this.searchValue = params.map;
        this.search();
      }
    })
  }

  ngAfterViewInit() {
    this.googleMapsLoader.loadApi.then((google) => {
      this.google = google;
      this.onGoogleLoaded(google);
    });
  }

  onFileUpload(e) {
    if (e && e.target && e.target.files) {
      const file = e.target.files[0];
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const rawData = fileReader.result as string;
        this.markers = JSON.parse(rawData);
        this.onMarkersLoaded();
        console.log(rawData);
        console.log(this.markers)
      }
      fileReader.readAsText(file);
    }
  }

  onGoogleLoaded(google) {
    this.map = new google.maps.Map(document.getElementById('map-canvas'), {
      zoom: 10,
      center: new google.maps.LatLng(33.2877683, -111.8231692),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      panControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL
      },
      scaleControl: false,
      styles: [{
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }]
    });

    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: []
      },
      polygonOptions: this.getPolygonOptions()
    });

    this.drawingManager.setMap(this.map);

    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event) => {
      if (event.type == google.maps.drawing.OverlayType.POLYGON) {
        this.addPolygon(event.overlay);
      }
    });
  }

  drawMarkersInPolygon(polygon: any) {
    const google = this.google;

    this.markers.forEach(markerData => {
      const position = markerData.position;
      const googleLatLng = new google.maps.LatLng(position.lat, position.lng);
      if (google.maps.geometry.poly.containsLocation(googleLatLng, polygon)) {
        if (markerData.googleMarker.getMap()) {
          markerData.googleMarker.setMap(null);
        } else {
          markerData.googleMarker.setMap(this.map);
        }
      }
    });
  }

  onMarkersLoaded() {
    const google = this.google;

    this.markers.forEach(markerData => {
      const googleMarker = new google.maps.Marker({
        position: markerData.position,
        map: null,
        title: markerData.title,
        icon: '/assets/icon.png'
      });

      const infowindow = new google.maps.InfoWindow({
        content: markerData.title
      });

      infowindow.open(this.map, googleMarker);
      googleMarker.setMap(null);

      googleMarker.addListener('click', function () {
        infowindow.open(this.map, googleMarker);
      });


      markerData.googleMarker = googleMarker;
      markerData.infowindow = infowindow;
    });
  }

  saveToBackend() {
    const name = this.searchValue;
    const polygons = this.polygons.map(polygon => {
      return {
        paths: (polygon as any).getPath().getArray().map(path => {
          return {
            lat: path.lat(),
            lng: path.lng()
          };
        })
      };
    });

    this.api.save(name, polygons, this.markers, this.map.center.toJSON(), this.map.getZoom());
  }

  search() {
    const name = this.searchValue;
    this.api.search(name).subscribe(map => {
      const google = this.google;
      if (map && map.name === name) {
        this.clearPolygons();
        for (let i = 0; i < map.polygons.length; i++) {
          this.addPolygon(new google.maps.Polygon({ paths: map.polygons[i].paths }));
        }
        if (map.zoom) {
          this.map.setZoom(map.zoom);
        }
        if (map.center) {
          this.map.setCenter(map.center)
        }
        if (map.markers) {
          this.markers = map.markers;
          this.onMarkersLoaded();
        }
      }
    })
  }

  addPolygon(polygon) {
    polygon.setOptions(this.getPolygonOptions());
    polygon.setMap(this.map);
    this.google.maps.event.addListener(polygon, 'click', (event) => {
      this.drawMarkersInPolygon(polygon);
    });
    this.polygons.push(polygon);
  }

  removePolygon(polygon) {
    this.polygons = this.polygons.filter(p => p !== polygon);
    polygon.setMap(null);
    // notifyDeleteWithUndoOption(polygon);
  }

  clearPolygons() {
    this.polygons.forEach(polygon => (polygon as any).setMap(null))
    this.polygons = [];
  }

  selectPolygon(polygon) {
    polygon.setOptions(this.getSelectedOptions());
  }

  deselectPolygon(polygon) {
    polygon.setOptions(this.getPolygonOptions());
  }

  refreshPolygons() {
    this.polygons.forEach(polygon => (polygon as any).setOptions(this.getPolygonOptions()));
  }

  getPolygonOptions() {
    return {
      strokeColor: '#000000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#F9E784',
      fillOpacity: this.fillOpacity,
      editable: this.mode === Mode.ADJUSTING
    };
  }

  getSelectedOptions() {
    return {
      strokeColor: '#000000',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#FF0000',
      fillOpacity: this.fillOpacity,
      editable: this.mode === Mode.ADJUSTING
    };
  }

  zoomIn = function () {
    this.map.setOptions({
      zoom: this.map.getZoom() + 1
    });
  }

  zoomOut = function () {
    this.map.setOptions({
      zoom: this.map.getZoom() - 1
    });
  }

  onDraw() {
    this.mode = Mode.DRAWING;
    this.onModeChange();
  }

  onFinish() {
    this.mode = Mode.VIEWING;
    this.onModeChange();
  }

  onAdjust() {
    this.mode = Mode.ADJUSTING;
    this.onModeChange();
  }

  onToggleFill() {
    if (this.fillOpacity > 0.26) {
      this.fillOpacity = 0.25;
    } else if (this.fillOpacity > 0.01) {
      this.fillOpacity = 0;
    } else {
      this.fillOpacity = 0.50;
    }
    this.refreshPolygons();
  }

  onModeChange() {
    let drawingMode = null;
    switch (this.mode) {
      case Mode.DRAWING:
        drawingMode = this.google.maps.drawing.OverlayType.POLYGON
        break;
      case Mode.ADJUSTING:
      case Mode.VIEWING:
        drawingMode = null;

    }
    this.drawingManager.setDrawingMode(drawingMode);
    this.refreshPolygons();
  }
}



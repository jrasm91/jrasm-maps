import { Component, OnInit, AfterViewInit } from '@angular/core';
import { GoogleLoaderService } from './services/google-loader.service';
import { PolygonServiceService } from './services/polygon-service.service';
import { ActivatedRoute } from '@angular/router'
import { modelGroupProvider } from '@angular/forms/src/directives/ng_model_group';

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
  polygons: Array<any> = [];
  searchValue = '';
  mode: Mode = Mode.VIEWING;
  fillOpacity = 0.25;

  private google: any;
  private map: any;
  private drawingManager: any;

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

  onGoogleLoaded(google) {
    this.map = new google.maps.Map(document.getElementById('map-canvas'), {
      zoom: 10,
      center: new google.maps.LatLng(33.2877683, -111.8231692),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      panControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      zoomControl: false,
      // zoomControlOptions: {
      //   style: google.maps.ZoomControlStyle.SMALL
      // },
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

  saveToBackend() {
    const name = this.searchValue;
    const polygons = this.polygons.map(polygon => {
      return {
        paths: polygon.getPath().getArray().map(path => {
          return {
            lat: path.lat(),
            lng: path.lng()
          };
        })
      };
    });

    this.api.save(name, polygons, this.map.center.toJSON(), this.map.getZoom());
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
      }
    })
  }

  addPolygon(polygon) {
    polygon.setOptions(this.getPolygonOptions());
    polygon.setMap(this.map);
    this.polygons.push(polygon)
  }

  removePolygon(polygon) {
    this.polygons = this.polygons.filter(p => p !== polygon);
    polygon.setMap(null);
    // notifyDeleteWithUndoOption(polygon);
  }

  clearPolygons() {
    this.polygons.forEach(polygon => polygon.setMap(null))
    this.polygons = [];
  }

  selectPolygon(polygon) {
    polygon.setOptions(this.getSelectedOptions());
  }

  deselectPolygon(polygon) {
    polygon.setOptions(this.getPolygonOptions());
  }

  refreshPolygons() {
    this.polygons.forEach(polygon => polygon.setOptions(this.getPolygonOptions()));
  }

  getPolygonOptions() {
    return {
      strokeColor: '#000000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: 'BLUE',
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



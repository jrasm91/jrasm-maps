export interface MapPosition {
    lat: number;
    lng: number;
}

export interface MapPolygon {
    paths: MapPosition[];
}

export interface MapMarker {
    title: string;
    position: MapPosition;
    infowindow: any;
    googleMarker: any;
}

export interface MapSaved {
    name: string;
    polygons: MapPolygon[];
    markers: MapMarker[];
    center: MapPosition;
    zoom: number;
}
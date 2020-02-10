import config from '../../app.config.json';

import jQuery from 'jquery';
import mapboxgl, {LngLatLike, Map, MapboxOptions} from "mapbox-gl";

const $: JQueryStatic = jQuery;



class App {
    public $loader: JQuery;
    public map: Map;

    constructor() {
        this.$loader = $( '#loader' );
    }

    start(): void {
        this.initMap();
    }

    initMap(): void {
        const mapOptions: MapboxOptions = {
            center: config.api.mapboxgl.center as LngLatLike,
            container: 'map',
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            zoom: config.api.mapboxgl.zoom as number
        };

        mapboxgl.accessToken = config.api.mapboxgl.accessToken;
        this.map = new mapboxgl.Map( mapOptions );
        this.map.on('load', this.onMapLoad.bind(this));
    }

    onMapLoad(): void {
        this.map.getContainer().style.display = 'block';
        this.map.resize();

        this.$loader.fadeOut();
    }
}

const app = new App;
export default app;


import {LngLat, LngLatLike} from "mapbox-gl";
import config from "../../app.config.json";

export default class EventData {
    public title: string;
    public description: string;
    public date_start: Date;
    public date_end: Date;
    public lngLat: LngLatLike;

    constructor( title: string, description: string, date_start: Date, date_end: Date, lngLat: LngLatLike | null = null ) {
        this.title = title;
        this.description = description;
        this.date_start = date_start;
        this.date_end = date_end;
        this.lngLat = lngLat ? lngLat : new LngLat( config.api.mapboxgl.center[0], config.api.mapboxgl.center[1] );
    }

    static getProperDate( date: Date ): string {
        let minProper: string = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes().toString() ;

        return  date.getDate() + '/' + ( date.getMonth() + 1 ) + '/' + date.getFullYear()
                            + ' à ' + date.getHours() + 'h' + minProper ;
    }
}
import config from "../../app.config.json";

import {LngLat, LngLatLike} from "mapbox-gl";

/**
 * Event object with data
 */
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

    /**
     * Convert date to string in friendly user format (static)
     *
     * @param date
     */
    static getProperDate( date: Date ): string {
        let minProper: string = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes().toString() ;

        return  date.getDate() + '/' + ( date.getMonth() + 1 ) + '/' + date.getFullYear()
                            + ' à ' + date.getHours() + 'h' + minProper ;
    }

    /**
     * Convert date to array in form format required (static)
     * result[0]: date
     * result[1]: time
     *
     * @param date
     */
    static getFormatDate( date: Date ): Array<string> {
        let dayProper: string = date.getDate() < 10 ? '0' + date.getDate() : date.getDate().toString() ;
        let monthProper: string = date.getMonth() < 10 ? '0' + (date.getMonth()+1) : (date.getMonth()+1).toString() ;
        let hourProper: string = date.getHours() < 10 ? '0' + date.getHours() : date.getHours().toString() ;
        let minProper: string = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes().toString() ;

        return [
            date.getFullYear() + '-' + monthProper + '-' + dayProper,
            hourProper + ':' + minProper
        ];
    }
}